import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * REAL PRODUCTION ON-CHAIN PAYMENT TEST SCRIPT
 * 
 * Shell Hygiene Protocol:
 * 1. read -s FUNDED_PRIVATE_KEY (Press Enter, paste key silently, press Enter)
 * 2. export FUNDED_PRIVATE_KEY
 * 3. export TARGET_HOST="https://api.yourdomain.com" && npm run test:real-payment
 * 4. unset FUNDED_PRIVATE_KEY
 * 5. Abandon / revoke disposable wallet after run.
 */
async function testRealOnChainPayment() {
  console.log('=================================================================');
  console.log(' 💳 REAL PRODUCTION ON-CHAIN BASE USDC PAYMENT TEST');
  console.log('=================================================================\n');

  let privateKey = process.env.FUNDED_PRIVATE_KEY;
  const targetHost = process.env.TARGET_HOST || 'http://localhost:3000';
  const expectedPayTo = (process.env.PAY_TO_ADDRESS || '0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315').toLowerCase();
  const expectedBaseUsdcContract = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase();
  const expectedChainId = 'eip155:8453';

  if (!privateKey) {
    console.log('⚠️ [NOTICE] FUNDED_PRIVATE_KEY is not set in environment.');
    console.log('   Correct Shell Input Procedure:');
    console.log('   1. Type command:  read -s FUNDED_PRIVATE_KEY');
    console.log('   2. Press Enter, paste private key silently, press Enter');
    console.log('   3. Type command:  export FUNDED_PRIVATE_KEY');
    console.log('   4. Run test:      export TARGET_HOST="https://api.yourdomain.com" && npm run test:real-payment');
    console.log('   5. Clean up:      unset FUNDED_PRIVATE_KEY');
    console.log('   6. Revoke/abandon disposable wallet after testing.\n');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Payer Wallet Address: ${wallet.address}`);
    console.log(`Target PayTo Wallet:  ${expectedPayTo}`);
    console.log(`Base USDC Contract:   ${expectedBaseUsdcContract}`);
    console.log(`Target Gateway Host:  ${targetHost}\n`);

    // 1. Check ETH Gas Balance
    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`Base ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    if (ethBalance === 0n) {
      throw new Error('Payer wallet has 0 Base ETH balance for gas!');
    }

    // 2. Fetch 402 Challenge from Target Gateway
    console.log('\n--- Step 1: Fetching HTTP 402 Challenge ---');
    const challengeRes = await fetch(`${targetHost}/v1/scrape?url=https://example.com`);
    const challengeJson = await challengeRes.json();
    
    const priceUsdc = challengeJson.x402?.priceUsdc || '0.02';
    const payTo = (challengeJson.x402?.payTo || '').toLowerCase();
    const network = challengeJson.x402?.network;

    console.log('402 Challenge Price:', priceUsdc, 'USDC');
    console.log('402 Challenge Recipient:', payTo);
    console.log('402 Challenge Network:', network);

    // Protocol Parameter Validations
    if (challengeRes.status !== 402) {
      throw new Error(`Expected HTTP 402 challenge but received ${challengeRes.status}`);
    }
    if (payTo !== expectedPayTo) {
      throw new Error(`PayTo mismatch: expected ${expectedPayTo}, received ${payTo}`);
    }
    if (network !== expectedChainId) {
      throw new Error(`Network mismatch: expected ${expectedChainId}, received ${network}`);
    }

    // 3. EIP-712 / OpenX402 Signature Generation
    console.log('\n--- Step 2: Generating Cryptographic Payment Signature ---');
    const message = `x402-payment:${payTo}:${priceUsdc}:${network}`;
    const signature = await wallet.signMessage(message);

    // 4. Submit Payment to Target Gateway
    console.log('\n--- Step 3: Submitting Signed Payment to Gateway ---');
    const paidRes = await fetch(`${targetHost}/v1/scrape?url=https://example.com`, {
      headers: {
        'User-Agent': 'x402-RealPayerClient/1.0',
        'X-402-Payment-Signature': signature
      }
    });

    console.log('Gateway Response Status:', paidRes.status);
    const paidJson = await paidRes.json();
    console.log('Returned Response Summary:', {
      status: paidJson.status,
      txId: paidJson.txId,
      settled: paidJson.x402_payment?.settled,
      payer: paidJson.x402_payment?.payer
    });

    if (paidRes.status !== 200 || !paidJson.x402_payment?.settled) {
      throw new Error('Gateway rejected payment or failed execution!');
    }

    console.log('\n=================================================================');
    console.log(' 🎉 REAL PRODUCTION PAYMENT TEST PASSED!');
    console.log(` Verified Settlement Transaction ID: ${paidJson.txId}`);
    console.log('=================================================================\n');
  } catch (err: any) {
    const safeError = err.message ? err.message.replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED_KEY]') : 'Unknown Error';
    console.error('❌ Real On-Chain Payment Test Failed:', safeError);
    process.exitCode = 1;
  } finally {
    privateKey = '';
    delete process.env.FUNDED_PRIVATE_KEY;
    console.log('🔒 Environment variable cleared. Run `unset FUNDED_PRIVATE_KEY` and abandon disposable wallet.');
  }
}

testRealOnChainPayment();
