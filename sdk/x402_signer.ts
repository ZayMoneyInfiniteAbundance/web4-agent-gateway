import { ethers } from "ethers";

const ASSET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export async function createPayment(requirements: any): Promise<string> {
  if (requirements.network !== "eip155:8453") throw new Error("Unexpected network");
  const asset = requirements.asset ?? requirements.extra?.asset;
  if (asset?.toLowerCase() !== ASSET.toLowerCase()) throw new Error("Unexpected USDC asset");
  const key = process.env.FUNDED_PRIVATE_KEY;
  if (!key) throw new Error("FUNDED_PRIVATE_KEY must be supplied at runtime");
  const wallet = new ethers.Wallet(key);
  const authorization = {
    from: wallet.address, to: requirements.payTo,
    value: String(requirements.maxAmountRequired ?? requirements.amount),
    validAfter: String(Math.floor(Date.now() / 1000) - 60),
    validBefore: String(Math.floor(Date.now() / 1000) + Number(requirements.maxTimeoutSeconds ?? 300)),
    nonce: ethers.hexlify(ethers.randomBytes(32)),
  };
  const domain = { name: requirements.extra?.name ?? "USD Coin", version: requirements.extra?.version ?? "2", chainId: 8453, verifyingContract: asset };
  const types = { TransferWithAuthorization: [
    { name: "from", type: "address" }, { name: "to", type: "address" }, { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" }, { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" },
  ]};
  const signature = await wallet.signTypedData(domain, types, authorization);
  return Buffer.from(JSON.stringify({ x402Version: 2, accepted: requirements, payload: { signature, authorization } })).toString("base64");
}

