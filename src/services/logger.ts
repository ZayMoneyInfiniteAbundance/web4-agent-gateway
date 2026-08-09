import fs from 'fs';
import path from 'path';

export interface AgentMoveLog {
  id: string;
  timestamp: string;
  type: 'PAYMENT_CHALLENGE' | 'PAYMENT_SETTLED' | 'SCRAPE_EXECUTE' | 'JIT_API_DEPLOY' | 'TELEMETRY_CHECK' | 'SYSTEM_ALERT';
  amountUsdc: string;
  payer: string;
  payTo: string;
  action: string;
  details: any;
}

export class ChannelLoggerService {
  private logFilePath: string;
  private memoryBuffer: AgentMoveLog[] = [];
  private maxBuffer = 200;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, 'agent_moves.jsonl');
    this.initSystemLog();
  }

  private initSystemLog() {
    this.log({
      type: 'SYSTEM_ALERT',
      amountUsdc: '0.00',
      payer: 'SYSTEM',
      payTo: process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315',
      action: 'Web 4.0 Automaton Gateway Initialized & Channel Logging Started',
      details: {
        network: process.env.NETWORK || 'eip155:8453',
        facilitator: process.env.FACILITATOR_URL || 'https://facilitator.openx402.ai'
      }
    });
  }

  public log(move: Omit<AgentMoveLog, 'id' | 'timestamp'>): AgentMoveLog {
    const fullMove: AgentMoveLog = {
      id: 'move_' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      ...move
    };

    // Buffer in memory
    this.memoryBuffer.unshift(fullMove);
    if (this.memoryBuffer.length > this.maxBuffer) {
      this.memoryBuffer.pop();
    }

    // Persist to JSONL file
    try {
      fs.appendFileSync(this.logFilePath, JSON.stringify(fullMove) + '\n');
    } catch (err) {
      console.error('Failed to write to channel log:', err);
    }

    return fullMove;
  }

  public getRecentMoves(limit = 50): AgentMoveLog[] {
    return this.memoryBuffer.slice(0, limit);
  }
}
