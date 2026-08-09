import { Hono } from 'hono';
import { x402PaymentMiddleware, CustomEnv } from '../middleware/x402';
import { UnblockerService } from '../services/unblocker';
import { globalStateMachine } from '../services/state_machine';

const scrapeRoute = new Hono<CustomEnv>();
const unblocker = new UnblockerService();

scrapeRoute.use('/v1/scrape', x402PaymentMiddleware({ priceUsdc: '0.02' }));

scrapeRoute.get('/v1/scrape', async (c) => {
  const targetUrl = c.req.query('url');
  const txId = c.get('txId');

  if (!targetUrl) {
    return c.json({ error: 'Missing required query parameter: ?url=https://example.com' }, 400);
  }

  // 6. STATE: API_EXECUTED
  if (txId) {
    globalStateMachine.transition(
      txId,
      'API_EXECUTED',
      `Unblocker engine rendering target URL: ${targetUrl}`
    );
  }

  const startMs = Date.now();
  const result = await unblocker.scrapeUrl(targetUrl);
  const executionMs = Date.now() - startMs;
  const payer = c.get('x402_payer') || 'Anonymous Payer Agent';

  // 7. STATE: RESPONSE_DELIVERED
  if (txId) {
    globalStateMachine.transition(
      txId,
      'RESPONSE_DELIVERED',
      `Clean markdown payload returned to client agent in ${executionMs}ms (${result.tokenCountEstimate} tokens).`,
      {
        resultSummary: {
          statusCode: result.statusCode,
          title: result.title,
          tokens: result.tokenCountEstimate,
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
      amount: '0.02 USDC',
      payer,
      mode: c.get('isDemoMode') ? 'DEMO' : 'LIVE'
    },
    data: result
  });
});

export default scrapeRoute;
