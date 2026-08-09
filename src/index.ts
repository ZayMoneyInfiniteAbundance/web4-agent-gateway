import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import dotenv from 'dotenv';

import scrapeRoute from './routes/scrape';
import factoryRoute from './routes/factory';
import healthRoute from './routes/health';
import termsRoute from './routes/terms';
import { renderDashboardHtml } from './views/dashboard';

dotenv.config();

const app = new Hono();

// Global request logger
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[Web4-Automaton-OS] ${c.req.method} ${c.req.path} -> Status: ${c.res.status} (${ms}ms)`);
});

// Serve Web 4.0 Automaton OS Dashboard UI on Root /
app.get('/', (c) => {
  const payTo = process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315';
  const network = process.env.NETWORK || 'eip155:8453';
  const facilitator = process.env.FACILITATOR_URL || 'https://facilitator.openx402.ai';

  const html = renderDashboardHtml(payTo, network, facilitator);
  return c.html(html);
});

// JSON API spec endpoint
app.get('/v1/spec', (c) => {
  return c.json({
    name: 'Web 4.0 Agent Gateway & JIT API Factory',
    version: '1.0.0',
    description: 'Sovereign machine-to-machine web rendering and JIT API factory powered by x402 on Base USDC.',
    payToAddress: process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315',
    endpoints: {
      dashboard: 'GET /',
      metrics: 'GET /v1/metrics',
      terms: 'GET /v1/terms',
      health: 'GET /v1/health',
      wallet: 'GET /v1/wallet',
      scrape: 'GET /v1/scrape?url=https://example.com ($0.02 USDC via x402)',
      createJitApi: 'POST /v1/factory/create ($0.50 USDC via x402)'
    }
  });
});

// Mount modular routes
app.route('/', healthRoute);
app.route('/', termsRoute);
app.route('/', scrapeRoute);
app.route('/', factoryRoute);

const port = Number(process.env.PORT) || 3000;

console.log(`\n=================================================================`);
console.log(` 💻 WEB 4.0 AUTOMATON OS — Control Center Running on Localhost`);
console.log(` 🌐 Dashboard URL: http://localhost:${port}`);
console.log(` 💳 USDC PayTo Wallet: ${process.env.PAY_TO_ADDRESS || '0x2E33...6315'}`);
console.log(` 📡 Real-Time Metrics: http://localhost:${port}/v1/metrics`);
console.log(`=================================================================\n`);

serve({
  fetch: app.fetch,
  port
});
