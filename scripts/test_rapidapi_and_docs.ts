import { Hono } from 'hono';
import docsRoute, { openApiSpec } from '../src/routes/docs';
import scrapeRoute from '../src/routes/scrape';
import healthRoute from '../src/routes/health';
import { CustomEnv } from '../src/middleware/x402';

async function runVerification() {
  console.log('=================================================================');
  console.log(' 🧪 TESTING DUAL-MODE GATEWAY (RAPIDAPI + x402 + SCALAR DOCS)');
  console.log('=================================================================\n');

  const app = new Hono<CustomEnv>();
  app.route('/', docsRoute);
  app.route('/', healthRoute);
  app.route('/', scrapeRoute);

  // Test 1: GET /openapi.json
  console.log('--- Test 1: GET /openapi.json ---');
  const specRes = await app.request('/openapi.json');
  console.log('Status:', specRes.status);
  const specJson: any = await specRes.json();
  console.log('Title:', specJson.info?.title);
  console.log('Endpoints count:', Object.keys(specJson.paths || {}).length);
  if (specRes.status !== 200 || !specJson.paths['/v1/scrape']) {
    throw new Error('OpenAPI spec endpoint failed');
  }
  console.log('✅ Test 1 Passed!\n');

  // Test 2: GET /docs (Scalar HTML)
  console.log('--- Test 2: GET /docs (Interactive Scalar UI) ---');
  const docsRes = await app.request('/docs');
  console.log('Status:', docsRes.status);
  const docsHtml = await docsRes.text();
  console.log('Contains Scalar Script:', docsHtml.includes('@scalar/api-reference'));
  if (docsRes.status !== 200 || !docsHtml.includes('@scalar/api-reference')) {
    throw new Error('Scalar documentation endpoint failed');
  }
  console.log('✅ Test 2 Passed!\n');

  // Test 3: GET /v1/scrape without keys -> Must return 402 Payment Required
  console.log('--- Test 3: GET /v1/scrape (No Auth -> Expect 402) ---');
  const unauthRes = await app.request('/v1/scrape?url=https://example.com');
  console.log('Status:', unauthRes.status);
  const unauthJson: any = await unauthRes.json();
  console.log('402 Challenge Protocol:', unauthJson.x402?.protocol);
  console.log('PayTo Address:', unauthJson.x402?.payTo);
  if (unauthRes.status !== 402) {
    throw new Error(`Expected 402 but got ${unauthRes.status}`);
  }
  console.log('✅ Test 3 Passed! (x402 Web3 Protection Intact)\n');

  // Test 4: GET /v1/scrape with RapidAPI Key -> Must return 200 OK
  console.log('--- Test 4: GET /v1/scrape with X-RapidAPI-Key (Expect 200 OK) ---');
  const rapidRes = await app.request('/v1/scrape?url=https://example.com', {
    headers: {
      'X-RapidAPI-Key': 'rapid_client_key_999',
      'X-RapidAPI-User': 'PayingSubscriber_42'
    }
  });
  console.log('Status:', rapidRes.status);
  const rapidJson: any = await rapidRes.json();
  console.log('Settled Status:', rapidJson.x402_payment?.settled);
  console.log('Payer Record:', rapidJson.x402_payment?.payer);
  console.log('Scraped Title:', rapidJson.data?.title);
  if (rapidRes.status !== 200 || !rapidJson.x402_payment?.settled) {
    throw new Error('RapidAPI authentication proxy failed');
  }
  console.log('✅ Test 4 Passed! (RapidAPI Instant Settlement Verified)\n');

  // Test 5: GET /v1/scrape with Direct API Key -> Must return 200 OK
  console.log('--- Test 5: GET /v1/scrape with X-API-Key: web4_demo_key ---');
  const apiKeyRes = await app.request('/v1/scrape?url=https://example.com', {
    headers: {
      'X-API-Key': 'web4_demo_key'
    }
  });
  console.log('Status:', apiKeyRes.status);
  const apiKeyJson: any = await apiKeyRes.json();
  console.log('Payer Record:', apiKeyJson.x402_payment?.payer);
  if (apiKeyRes.status !== 200) {
    throw new Error('Direct API key authentication failed');
  }
  console.log('✅ Test 5 Passed! (Direct API Key Verified)\n');

  console.log('=================================================================');
  console.log(' 🏆 ALL 5 GATEWAY TESTS PASSED! READY FOR RAPIDAPI & PUBLIC LAUNCH');
  console.log('=================================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ Verification Failed:', err);
  process.exit(1);
});
