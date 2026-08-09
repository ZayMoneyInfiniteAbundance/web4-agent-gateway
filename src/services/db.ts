import fs from 'fs';
import path from 'path';
import { TransactionRecord } from './state_machine';
import { DeploymentResult } from './api_factory';

export interface WalletSpendingCap {
  wallet: string;
  date: string;
  totalSpentUsdc: number;
}

export class PersistentDatabaseService {
  private dataDir: string;
  private dbPath: string;
  private dbData: {
    transactions: Record<string, TransactionRecord>;
    deployments: Record<string, DeploymentResult>;
    settledSignatures: Record<string, string>; // sigHash -> timestamp
    dailySpendingCaps: Record<string, WalletSpendingCap>; // wallet:date -> cap
  };

  constructor() {
    this.dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.dbPath = path.join(this.dataDir, 'store.db.json');
    this.dbData = this.loadStore();
  }

  private loadStore() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          transactions: parsed.transactions || {},
          deployments: parsed.deployments || {},
          settledSignatures: parsed.settledSignatures || {},
          dailySpendingCaps: parsed.dailySpendingCaps || {}
        };
      }
    } catch (err) {
      console.error('Warning: Failed to load existing DB store, creating fresh store:', err);
    }
    return { transactions: {}, deployments: {}, settledSignatures: {}, dailySpendingCaps: {} };
  }

  public saveTransaction(tx: TransactionRecord) {
    this.dbData.transactions[tx.txId] = tx;
    this.flush();
  }

  public getTransaction(txId: string): TransactionRecord | undefined {
    return this.dbData.transactions[txId];
  }

  public getAllTransactions(): TransactionRecord[] {
    return Object.values(this.dbData.transactions).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Replay Attack Signature Persistence
  public isSignatureSettled(sigHash: string): boolean {
    return Boolean(this.dbData.settledSignatures[sigHash]);
  }

  public markSignatureSettled(sigHash: string) {
    this.dbData.settledSignatures[sigHash] = new Date().toISOString();
    this.flush();
  }

  // Spending Cap Controls
  public checkAndRecordSpendingCap(wallet: string, amountUsdc: number, capLimitUsdc = 50.0): boolean {
    const today = new Date().toISOString().split('T')[0];
    const key = `${wallet.toLowerCase()}:${today}`;

    const current = this.dbData.dailySpendingCaps[key] || {
      wallet: wallet.toLowerCase(),
      date: today,
      totalSpentUsdc: 0
    };

    if (current.totalSpentUsdc + amountUsdc > capLimitUsdc) {
      return false; // Exceeds daily spending cap
    }

    current.totalSpentUsdc += amountUsdc;
    this.dbData.dailySpendingCaps[key] = current;
    this.flush();
    return true;
  }

  public saveDeployment(deployment: DeploymentResult) {
    this.dbData.deployments[deployment.apiId] = deployment;
    this.flush();
  }

  public getAllDeployments(): DeploymentResult[] {
    return Object.values(this.dbData.deployments);
  }

  public backup(backupPath?: string): string {
    const dest = backupPath || path.join(this.dataDir, `backup_store_${Date.now()}.json`);
    fs.writeFileSync(dest, JSON.stringify(this.dbData, null, 2));
    return dest;
  }

  public restore(backupPath: string): boolean {
    if (!fs.existsSync(backupPath)) return false;
    const raw = fs.readFileSync(backupPath, 'utf8');
    this.dbData = JSON.parse(raw);
    this.flush();
    return true;
  }

  private flush() {
    try {
      const tmpPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.dbData, null, 2));
      fs.renameSync(tmpPath, this.dbPath);
    } catch (err) {
      console.error('Failed to flush persistent DB store:', err);
    }
  }
}

export const globalDb = new PersistentDatabaseService();
