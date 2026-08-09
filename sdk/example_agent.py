import json
import os
import requests
from x402_signer import create_payment

ENDPOINT = os.getenv("TARGET_HOST", "https://web4-agent-gateway-production.up.railway.app/v1/scrape")


def main() -> None:
    target = os.getenv("SCRAPE_URL", "https://example.com")
    first = requests.get(ENDPOINT, params={"url": target}, timeout=60)
    if first.status_code == 200:
        print(first.text)
        return
    if first.status_code != 402:
        raise RuntimeError(f"Unexpected HTTP {first.status_code}")
    challenge = first.json().get("x402", {})
    requirements = {"network": challenge["network"], "payTo": challenge["payTo"], "amount": "20000", "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "extra": {"name": "USD Coin", "version": "2"}}
    proof = create_payment(requirements)
    paid = requests.get(ENDPOINT, params={"url": target}, headers={"X-402-Payment-Signature": proof}, timeout=60)
    if paid.status_code != 200:
        raise RuntimeError(f"Paid request failed with HTTP {paid.status_code}: {paid.text[:200]}")
    print(paid.text)


if __name__ == "__main__":
    main()
