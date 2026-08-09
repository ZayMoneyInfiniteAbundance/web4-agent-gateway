import { Hono } from 'hono';
import { x402PaymentMiddleware, CustomEnv } from '../middleware/x402';
import { ApiFactoryService } from '../services/api_factory';
import { globalStateMachine } from '../services/state_machine';

const factoryRoute = new Hono<CustomEnv>();
export const factoryService = new ApiFactoryService();

factoryRoute.use('/v1/factory/create', x402PaymentMiddleware({ priceUsdc: '0.50' }));

factoryRoute.post('/v1/factory/create', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, targetUrl, pricePerQueryUsdc, category, description } = body;
  const txId = c.get('txId');

  if (!name || !targetUrl) {
    return c.json({ error: 'Missing required parameters: name and targetUrl' }, 400);
  }

  // 6. STATE: API_EXECUTED
  if (txId) {
    globalStateMachine.transition(
      txId,
      'API_EXECUTED',
      `JIT API Engine provisioning sandbox node for ${name}`
    );
  }

  const startMs = Date.now();
  const payerAddress = c.get('x402_payer') || process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315';
  const deployment = await factoryService.deployJitApi(
    {
      name,
      targetUrl,
      pricePerQueryUsdc: pricePerQueryUsdc || '0.10',
      category: category || 'General',
      description: description || 'Autonomous JIT Micro-API'
    },
    payerAddress
  );
  const executionMs = Date.now() - startMs;

  // 7. STATE: RESPONSE_DELIVERED
  if (txId) {
    globalStateMachine.transition(
      txId,
      'RESPONSE_DELIVERED',
      `Conway sandbox ${deployment.conwaySandboxId} deployed at ${deployment.endpointUrl}`,
      {
        resultSummary: {
          statusCode: 200,
          apiId: deployment.apiId,
          executionMs
        }
      }
    );
  }

  return c.json({
    status: 'success',
    txId,
    x402_payment: {
      settled: true,
      amount: '0.50 USDC',
      payer: payerAddress,
      mode: c.get('isDemoMode') ? 'DEMO' : 'LIVE'
    },
    deployment
  });
});

factoryRoute.get('/v1/factory/list', (c) => {
  return c.json({
    total: factoryService.listApis().length,
    apis: factoryService.listApis()
  });
});

export default factoryRoute;
