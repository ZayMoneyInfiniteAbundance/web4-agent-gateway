import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { globalDb } from './db';

export type PaymentState =
  | 'REQUEST'
  | 'HTTP_402_CHALLENGE'
  | 'PAYMENT_DETECTED'
  | 'FACILITATOR_VERIFY'
  | 'PAYMENT_SETTLED'
  | 'API_EXECUTED'
  | 'RESPONSE_DELIVERED';

export interface StateTransition {
  state: PaymentState;
  timestamp: string;
  detail: string;
}

export interface TransactionRecord {
  txId: string;
  mode: 'LIVE' | 'DEMO';
  agent: string;
  endpoint: string;
  httpStatus: number;
  priceUsdc: string;
  isSettled: boolean;
  currentState: PaymentState;
  transitions: StateTransition[];
  requestDetails: {
    method: string;
    path: string;
    query: any;
    headers: Record<string, string>;
  };
  paymentDetails?: {
    payer: string;
    payTo: string;
    network: string;
    txHash?: string;
    signature: string;
  };
  resultSummary?: {
    statusCode: number;
    title?: string;
    tokens?: number;
    apiId?: string;
    executionMs?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SystemHealth {
  gateway: 'GREEN' | 'YELLOW' | 'RED';
  facilitator: 'GREEN' | 'YELLOW' | 'RED';
  wallet: 'GREEN' | 'YELLOW' | 'RED';
  baseNetwork: 'GREEN' | 'YELLOW' | 'RED';
  scrapeEndpoint: 'GREEN' | 'YELLOW' | 'RED';
  jitEngine: 'GREEN' | 'YELLOW' | 'RED';
}

export class TransactionStateMachine {
  private logFilePath: string;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, 'transactions.jsonl');
  }

  public createTransaction(
    mode: 'LIVE' | 'DEMO',
    agent: string,
    endpoint: string,
    priceUsdc: string,
    reqDetails: any
  ): TransactionRecord {
    const txNum = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
    const txId = `TX-${txNum}`;
    const now = new Date().toISOString();

    const tx: TransactionRecord = {
      txId,
      mode,
      agent,
      endpoint,
      httpStatus: 402,
      priceUsdc,
      isSettled: false,
      currentState: 'REQUEST',
      transitions: [
        {
          state: 'REQUEST',
          timestamp: now,
          detail: `Initial HTTP request received for ${endpoint}`
        }
      ],
      requestDetails: reqDetails,
      createdAt: now,
      updatedAt: now
    };

    globalDb.saveTransaction(tx);
    this.persistTx(tx);
    return tx;
  }

  public transition(txId: string, newState: PaymentState, detail: string, extraData?: Partial<TransactionRecord>): TransactionRecord | undefined {
    const tx = globalDb.getTransaction(txId);
    if (!tx) return undefined;

    tx.currentState = newState;
    tx.updatedAt = new Date().toISOString();
    tx.transitions.push({
      state: newState,
      timestamp: tx.updatedAt,
      detail
    });

    if (extraData) {
      if (extraData.httpStatus) tx.httpStatus = extraData.httpStatus;
      if (extraData.isSettled !== undefined) tx.isSettled = extraData.isSettled;
      if (extraData.paymentDetails) tx.paymentDetails = { ...tx.paymentDetails, ...extraData.paymentDetails };
      if (extraData.resultSummary) tx.resultSummary = { ...tx.resultSummary, ...extraData.resultSummary };
    }

    globalDb.saveTransaction(tx);
    this.persistTx(tx);
    return tx;
  }

  public getTransaction(txId: string): TransactionRecord | undefined {
    return globalDb.getTransaction(txId);
  }

  public getAllTransactions(): TransactionRecord[] {
    return globalDb.getAllTransactions();
  }

  public getStats() {
    let liveRevenueUsdc = 0;
    let demoRevenueUsdc = 0;
    let liveTxCount = 0;
    let demoTxCount = 0;

    const allTx = globalDb.getAllTransactions();

    for (const tx of allTx) {
      const price = parseFloat(tx.priceUsdc || '0');
      if (tx.isSettled) {
        if (tx.mode === 'LIVE') {
          liveRevenueUsdc += price;
          liveTxCount++;
        } else {
          demoRevenueUsdc += price;
          demoTxCount++;
        }
      }
    }

    return {
      liveRevenueUsdc: liveRevenueUsdc.toFixed(2),
      demoRevenueUsdc: demoRevenueUsdc.toFixed(2),
      totalTransactions: allTx.length,
      liveTxCount,
      demoTxCount
    };
  }

  public async checkHealth(): Promise<SystemHealth> {
    const facilitatorOk = await this.pingUrl('https://facilitator.openx402.ai/whitelist/0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315');
    const baseRpcOk = await this.pingUrl('https://mainnet.base.org');

    return {
      gateway: 'GREEN',
      facilitator: facilitatorOk ? 'GREEN' : 'YELLOW',
      wallet: 'GREEN',
      baseNetwork: baseRpcOk ? 'GREEN' : 'YELLOW',
      scrapeEndpoint: 'GREEN',
      jitEngine: 'GREEN'
    };
  }

  private pingUrl(urlStr: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const u = new URL(urlStr);
        const lib = u.protocol === 'https:' ? https : http;
        const req = lib.get(urlStr, { timeout: 3000 }, (res) => {
          resolve(res.statusCode ? res.statusCode < 500 : false);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      } catch {
        resolve(false);
      }
    });
  }

  private persistTx(tx: TransactionRecord) {
    try {
      fs.appendFileSync(this.logFilePath, JSON.stringify(tx) + '\n');
    } catch (err) {
      console.error('Failed to write transaction log:', err);
    }
  }
}

export const globalStateMachine = new TransactionStateMachine();
