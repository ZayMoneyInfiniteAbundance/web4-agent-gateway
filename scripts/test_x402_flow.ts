import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import dotenv from 'dotenv';
import scrapeRoute from '../src/routes/scrape';
import factoryRoute from '../src/routes/factory';
import healthRoute from '../src/routes/health';
import { ethers } from 'ethers';

dotenv.config();

async function runTest() {
  console.log('🧪 Starting x402 Protocol & Web 4.0 Verification Test...\n');

  const app = new Hono();
  app.route('/', healthRoute);
  app.route('/', scrapeRoute);
  app.route('/', factoryRoute);

  const server = serve({ fetch: app.fetch, port: 3001 });
  console.log('✅ Temporary Test Server Listening on port 3001');

  try {
    // 1. Health Check
    console.log('\n--- Test 1: Public Telemetry Endpoint (/v1/health) ---');
    const healthRes = await fetch('http://localhost:3001/v1/health');
    console.log('Status Code:', healthRes.status);
    const healthJson = await healthRes.json();
    console.log('Telemetry Output:', JSON.stringify(healthJson, null, 2));

    // 2. Unauthenticated Scrape Call -> Expect 402 Payment Required
    console.log('\n--- Test 2: Unauthenticated Request (/v1/scrape) ---');
    const unauthRes = await fetch('http://localhost:3001/v1/scrape?url=https://example.com');
    console.log('Status Code (Expected 402):', unauthRes.status);
    const unauthJson = await unauthRes.json();
    console.log('HTTP 402 Challenge Payload:', JSON.stringify(unauthJson, null, 2));

    if (unauthRes.status !== 402) {
      throw new Error(`Expected HTTP 402 but received ${unauthRes.status}`);
    }

    // 3. Paid Scrape Call with EIP-712 / Signed x402 Payment Signature
    console.log('\n--- Test 3: Signed x402 Payment Request ($0.02 USDC) ---');
    const wallet = ethers.Wallet.createRandom();
    const targetPayTo = process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315';
    const message = `x402-payment:${targetPayTo}:0.02 USDC:eip155:8453`;
    const signature = await wallet.signMessage(message);

    const paidRes = await fetch('http://localhost:3001/v1/scrape?url=https://example.com', {
      headers: {
        'X-402-Payment-Signature': signature
      }
    });

    console.log('Status Code (Expected 200):', paidRes.status);
    const paidJson = await paidRes.json();
    console.log('Paid Response Summary:', {
      status: paidJson.status,
      x402_payment: paidJson.x402_payment,
      title: paidJson.data?.title,
      tokenEstimate: paidJson.data?.tokenCountEstimate,
      unblockedVia: paidJson.data?.unblockedVia
    });

    if (paidRes.status !== 200 || !paidJson.x402_payment?.settled) {
      throw new Error(`Expected HTTP 200 OK with settled x402 payment, received ${paidRes.status}`);
    }

    // 4. JIT API Creation Call ($0.50 USDC)
    console.log('\n--- Test 4: JIT API Creation Call ($0.50 USDC) ---');
    const factoryRes = await fetch('http://localhost:3001/v1/factory/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-402-Payment-Signature': signature
      },
      body: JSON.stringify({
        name: 'TeslaInventoryMiami',
        targetUrl: 'https://www.tesla.com/inventory/new/m3',
        pricePerQueryUsdc: '0.15',
        category: 'Automotive Data',
        description: 'Real-time Tesla vehicle inventory extraction for agent auto-buyers'
      })
    });

    console.log('Status Code (Expected 200):', factoryRes.status);
    const factoryJson = await factoryRes.json();
    console.log('Created JIT API Deployment:', JSON.stringify(factoryJson.deployment, null, 2));

    if (factoryRes.status !== 200 || !factoryJson.deployment?.apiId) {
      throw new Error(`Failed to create JIT API`);
    }

    console.log('\n🎉 ALL X402 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Test Execution Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTest();
