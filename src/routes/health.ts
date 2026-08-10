import { Hono } from 'hono';
import crypto from 'crypto';
import { globalStateMachine } from '../services/state_machine';
import { globalEmergencyPause } from '../middleware/x402';
import { factoryService } from './factory';

const healthRoute = new Hono();

// Enforce high-entropy admin key security:
// 1. Read ADMIN_API_KEY from environment secrets if set.
// 2. If omitted, generate a high-entropy 64-character secret.
// 3. Display securely ONCE in process stdout at startup. Never leak in telemetry or logs.
let activeAdminKey = process.env.ADMIN_API_KEY;

if (!activeAdminKey) {
  activeAdminKey = crypto.randomBytes(32).toString('hex');
  console.log(`\n🔑 [SECURITY AUDIT] Generated One-Time High-Entropy Admin Key: ${activeAdminKey}`);
  console.log(`   (Persist this key in your environment secret manager. Never share publicly.)\n`);
}

const getAdminKey = () => activeAdminKey;

healthRoute.get('/v1/health', async (c) => {
  const health = await globalStateMachine.checkHealth();
  const stats = globalStateMachine.getStats();

  return c.json({
    status: globalEmergencyPause.isPaused ? 'PAUSED' : 'HEALTHY',
    protocol: 'Web 4.0 / x402',
    network: process.env.NETWORK || 'eip155:8453',
    payToAddress: process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315',
    facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.openx402.ai',
    uptimeSeconds: process.uptime(),
    emergencyPause: globalEmergencyPause.isPaused,
    health: {
      gateway: globalEmergencyPause.isPaused ? 'YELLOW' : health.gateway,
      facilitator: health.facilitator,
      wallet: health.wallet
    },
    services: {
      unblocker: { endpoint: '/v1/scrape', priceUsdc: '0.02' },
      apiFactory: { endpoint: '/v1/factory/create', priceUsdc: '0.50' },
      memecoinAlpha: { endpoint: '/v1/memecoin/alpha', priceUsdc: '0.10' }
    }
  });
});

healthRoute.post('/v1/admin/pause', (c) => {
  const reqKey = c.req.header('X-Admin-Token') || c.req.query('admin_token');

  if (!reqKey || reqKey !== getAdminKey()) {
    return c.json({ error: 'Unauthorized', message: 'Valid X-Admin-Token header required' }, 401);
  }

  const { pause } = c.req.query();
  const shouldPause = pause === 'true' || pause === '1';
  globalEmergencyPause.isPaused = shouldPause;

  // Audit log without exposing admin key
  globalStateMachine.createTransaction(
    'LIVE',
    'ADMIN_OPERATOR',
    '/v1/admin/pause',
    '0.00',
    { action: shouldPause ? 'EMERGENCY_PAUSE_ACTIVATED' : 'EMERGENCY_PAUSE_RESUMED', timestamp: new Date().toISOString() }
  );

  return c.json({
    status: 'SUCCESS',
    emergencyPause: globalEmergencyPause.isPaused,
    timestamp: new Date().toISOString(),
    message: globalEmergencyPause.isPaused 
      ? 'EMERGENCY PAUSE ACTIVATED: All payment challenges and scraper execution suspended at middleware entry.'
      : 'GATEWAY RESUMED: Normal x402 payments and scraping execution active.'
  });
});

healthRoute.get('/v1/metrics', (c) => {
  const reqKey = c.req.header('X-Admin-Token') || c.req.query('admin_token');

  if (reqKey !== getAdminKey()) {
    return c.json({
      status: globalEmergencyPause.isPaused ? 'PAUSED' : 'ACTIVE',
      protocol: 'Web 4.0 / x402',
      sanitizedMetrics: {
        gatewayStatus: globalEmergencyPause.isPaused ? 'PAUSED' : 'HEALTHY',
        uptimeSeconds: Math.floor(process.uptime()),
        spendingCapActive: true,
        replayProtectionActive: true,
        emergencyPause: globalEmergencyPause.isPaused
      },
      notice: 'Detailed internal memory and wallet metrics require X-Admin-Token header.'
    });
  }

  const mem = process.memoryUsage();
  const stats = globalStateMachine.getStats();

  return c.json({
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    emergencyPause: globalEmergencyPause.isPaused,
    memory: {
      rssMb: (mem.rss / 1024 / 1024).toFixed(2),
      heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(2)
    },
    transactionStats: stats,
    betaControls: {
      maxDailyUsdcPerWallet: process.env.MAX_DAILY_USDC_PER_WALLET || '50.0',
      spendingCapActive: true,
      replayProtectionActive: true,
      emergencyPause: globalEmergencyPause.isPaused
    }
  });
});

healthRoute.get('/v1/transactions', (c) => {
  const reqKey = c.req.header('X-Admin-Token') || c.req.query('admin_token');

  if (reqKey !== getAdminKey()) {
    return c.json({
      error: 'Unauthorized',
      message: 'Access to detailed transaction records requires X-Admin-Token header.'
    }, 401);
  }

  const txs = globalStateMachine.getAllTransactions();
  const stats = globalStateMachine.getStats();
  const apis = factoryService.listApis();

  return c.json({
    stats,
    totalApis: apis.length,
    apis,
    transactions: txs
  });
});

healthRoute.get('/v1/transaction/:txId', (c) => {
  const txId = c.req.param('txId');
  const tx = globalStateMachine.getTransaction(txId);

  if (!tx) {
    return c.json({ error: `Transaction ${txId} not found` }, 404);
  }

  return c.json({
    txId: tx.txId,
    mode: tx.mode,
    endpoint: tx.endpoint,
    httpStatus: tx.httpStatus,
    priceUsdc: tx.priceUsdc,
    isSettled: tx.isSettled,
    currentState: tx.currentState,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    resultSummary: tx.resultSummary
  });
});

healthRoute.get('/v1/openapi.json', (c) => {
  const payTo = process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315';
  const host = c.req.header('host') || 'localhost:3000';
  const proto = c.req.header('x-forwarded-proto') || 'http';

  return c.json({
    openapi: '3.0.3',
    info: {
      title: 'Web 4.0 Agent Gateway & x402 Unblocker Service',
      version: '1.0.0',
      description: 'Controlled Beta machine-to-machine paywalled API platform powered by OpenX402 and Base USDC.'
    },
    servers: [
      { url: `${proto}://${host}`, description: 'Active Gateway Node' }
    ],
    paths: {
      '/v1/scrape': {
        get: {
          summary: 'Scrape and unblock target web page into clean markdown',
          parameters: [
            { name: 'url', in: 'query', required: true, schema: { type: 'string' }, description: 'Target URL to render' }
          ],
          responses: {
            '200': { description: 'Successful render with settled x402 payment' },
            '402': { description: 'Payment Required challenge (Returns $0.02 USDC price tag and payTo address)' }
          },
          security: [{ x402PaymentSignature: [] }]
        }
      },
      '/v1/factory/create': {
        post: {
          summary: 'Provision an on-demand JIT Micro-API sandbox node',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    targetUrl: { type: 'string' },
                    pricePerQueryUsdc: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'JIT Micro-API provisioned on Conway Cloud' },
            '402': { description: 'Payment Required ($0.50 USDC)' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        x402PaymentSignature: {
          type: 'apiKey',
          in: 'header',
          name: 'X-402-Payment-Signature',
          description: `Cryptographic EIP-712 payment signature or OpenX402 facilitator proof payable to ${payTo}`
        }
      }
    }
  });
});

export default healthRoute;
