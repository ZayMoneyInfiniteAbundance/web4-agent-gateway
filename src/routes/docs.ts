import { Hono } from 'hono';

const docsRoute = new Hono();

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Web 4.0 AI Web Scraper & Markdown Unblocker API',
    version: '1.0.0',
    description: `## Enterprise Web Scraping, Bot Unblocking & LLM Markdown Extraction

Designed specifically for **AI Agents, LLMs, and RAG pipelines**. Converts complex JavaScript-heavy web pages into clean, token-optimized Markdown in milliseconds.

### Dual Monetization & Access Modes:
1. **RapidAPI Hub / API Key (Zero Wallet Setup):**
   - Provide header \`X-RapidAPI-Key: <your_key>\` or \`X-API-Key: <your_key>\`.
   - RapidAPI handles subscriptions and automated credit-card billing.
2. **Web 4.0 Autonomous x402 Micropayments (Base USDC):**
   - If calling without an API key, the gateway returns \`HTTP 402 Payment Required\`.
   - AI agents cryptographically sign an EIP-3009 transfer of **$0.02 USDC** to \`0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315\` on Base network (\`eip155:8453\`).
   - Settle instantly with zero human friction.

---
### Key Capabilities:
- ⚡ **High-speed extraction** with residential and headless browser unblocking
- 🧹 **Noise-free Markdown** stripped of ads, tracking scripts, navigation clutter, and boilerplate
- 📊 **Token estimate metrics** returned with every scrape to monitor LLM context usage
- 🔒 **Zero rate-limit lockouts** when authenticated via RapidAPI or x402`,
    contact: {
      name: 'Conway Web 4.0 Automaton Engineering',
      url: 'https://web4-agent-gateway-production.up.railway.app'
    }
  },
  servers: [
    {
      url: 'https://web4-agent-gateway-production.up.railway.app',
      description: 'Production Gateway (Railway Live)'
    },
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    }
  ],
  paths: {
    '/v1/scrape': {
      get: {
        tags: ['Scraper Engine'],
        summary: 'Scrape Web Page & Convert to Clean Markdown',
        description: 'Bypasses bot protections, strips extraneous HTML tags (scripts, styles, tracking pixels), and delivers token-optimized markdown ready for prompt injection.',
        operationId: 'scrapeUrl',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            description: 'Target URL to scrape and unblock (e.g. https://news.ycombinator.com)',
            schema: {
              type: 'string',
              format: 'uri',
              example: 'https://news.ycombinator.com'
            }
          }
        ],
        security: [
          { RapidAPIKey: [] },
          { ApiKeyAuth: [] },
          { x402PaymentSignature: [] }
        ],
        responses: {
          '200': {
            description: 'Successfully scraped and formatted payload',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ScrapeResponse'
                }
              }
            }
          },
          '400': {
            description: 'Missing URL or invalid request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Missing required query parameter: ?url=https://example.com' }
                  }
                }
              }
            }
          },
          '402': {
            description: 'Payment Required (Returns x402 Base USDC challenge)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaymentRequiredChallenge'
                }
              }
            }
          }
        }
      }
    },
    '/v1/memecoin/alpha': {
      get: {
        tags: ['Intelligence & Alpha'],
        summary: 'Base Network Smart Money & Memecoin Alpha Scanner',
        description: 'Scans DexScreener & Base on-chain inflow streams for high-conviction liquidity locks and smart money movements.',
        operationId: 'getMemecoinAlpha',
        parameters: [
          {
            name: 'network',
            in: 'query',
            required: false,
            description: 'Blockchain network (default: base)',
            schema: {
              type: 'string',
              default: 'base',
              example: 'base'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Alpha insights feed'
          },
          '402': {
            description: 'Payment Required ($0.10 USDC on Base)'
          }
        }
      }
    },
    '/v1/health': {
      get: {
        tags: ['System'],
        summary: 'Gateway Health & Operational Status',
        description: 'Returns real-time gateway health, facilitator connectivity, and pricing parameters.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Gateway is fully operational'
          }
        }
      }
    },
    '/v1/metrics': {
      get: {
        tags: ['System'],
        summary: 'System Telemetry & Gateway Metrics',
        description: 'Returns system uptime, spending caps, and replay protection status.',
        operationId: 'getMetrics',
        responses: {
          '200': {
            description: 'Active system telemetry'
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      RapidAPIKey: {
        type: 'apiKey',
        name: 'X-RapidAPI-Key',
        in: 'header',
        description: 'RapidAPI Hub Proxy Client Key'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'Direct Gateway API Key'
      },
      x402PaymentSignature: {
        type: 'apiKey',
        name: 'X-402-Payment-Signature',
        in: 'header',
        description: 'Cryptographic EIP-3009 transfer signature on Base USDC ($0.02/call)'
      }
    },
    schemas: {
      ScrapeResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          txId: { type: 'string', example: 'TX-450E6' },
          x402_payment: {
            type: 'object',
            properties: {
              settled: { type: 'boolean', example: true },
              amount: { type: 'string', example: '0.02 USDC' },
              payer: { type: 'string', example: 'RapidAPI:developer_username' },
              mode: { type: 'string', example: 'LIVE' }
            }
          },
          data: {
            type: 'object',
            properties: {
              url: { type: 'string', example: 'https://news.ycombinator.com' },
              statusCode: { type: 'integer', example: 200 },
              title: { type: 'string', example: 'Hacker News' },
              contentMarkdown: { type: 'string', example: '# Hacker News\n\n1. Show HN: AI Scraper...' },
              tokenCountEstimate: { type: 'integer', example: 1450 },
              unblockedVia: { type: 'string', example: 'Conway-Web4-Gateway/v1 (Residential/Headless Pool)' },
              timestamp: { type: 'string', example: '2026-09-21T12:00:00.000Z' }
            }
          }
        }
      },
      PaymentRequiredChallenge: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 402 },
          error: { type: 'string', example: 'Payment Required' },
          txId: { type: 'string', example: 'TX-402E1' },
          x402: {
            type: 'object',
            properties: {
              protocol: { type: 'string', example: 'x402/v2' },
              priceUsdc: { type: 'string', example: '0.02' },
              payTo: { type: 'string', example: '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315' },
              network: { type: 'string', example: 'eip155:8453' },
              asset: { type: 'string', example: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
              assetTransferMethod: { type: 'string', example: 'eip3009' },
              facilitator: { type: 'string', example: 'https://facilitator.openx402.ai' }
            }
          }
        }
      }
    }
  }
};

// Serve OpenAPI Spec
docsRoute.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// Serve Modern Interactive Scalar API Documentation
docsRoute.get('/docs', (c) => {
  return c.html(`<!doctype html>
<html>
  <head>
    <title>Web 4.0 Scraper & AI Agent Gateway — API Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>">
    <style>
      body { margin: 0; background: #0f172a; }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-configuration='{"theme":"purple","layout":"modern","defaultOpenAllTags":true}'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
});

// Fallback Swagger UI
docsRoute.get('/docs/swagger', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swagger UI — Web 4.0 Agent Gateway</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0b0f19; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .wrapper { max-width: 1200px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "BaseLayout",
      deepLinking: true
    });
  </script>
</body>
</html>`);
});

export default docsRoute;
