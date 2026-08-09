import { Hono } from 'hono';

const termsRoute = new Hono();

termsRoute.get('/v1/terms', (c) => {
  return c.json({
    title: 'Web 4.0 Agent Gateway — Operational Developer & Crawler Guidelines',
    version: '1.0.0',
    lastUpdated: '2026-08-09',
    disclaimer: 'OPERATIONAL DOCUMENTATION ONLY: These developer guidelines provide technical and operational context for automated web crawlers. This document does not substitute for formal legal review by licensed legal counsel.',
    overview: 'This API Gateway provides machine-to-machine paid web rendering and unblocking services to autonomous AI agents over the OpenX402 protocol.',
    operationalRules: [
      '1. Fair-Use Scraping: The scraper service respects robots.txt directives and rate limits target web servers.',
      '2. Payment Finality: All x402 USDC micropayments settled on Base (eip155:8453) are non-refundable once content is delivered.',
      '3. Prohibited Content: Requests targeting illegal content, private user credentials, or bypassing paywalls of non-public sites are blocked.',
      '4. Beta Daily Spending Caps: Wallets are subject to a configurable $50.00 USDC daily spending cap during the controlled beta phase.'
    ],
    contact: 'root@conway.tech'
  });
});

export default termsRoute;
