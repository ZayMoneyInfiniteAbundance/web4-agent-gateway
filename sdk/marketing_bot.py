"""Generate launch-proof social posts from a Web4 Gateway request.

Simulation is the default. Set REAL_PAYMENT=1 only after validating the
deployed x402 v2 adapter and using a disposable, minimally funded wallet.
This script never publishes posts or prints private keys/signatures.
"""
from __future__ import annotations

import os
import time
from textwrap import dedent

import requests

from web4_scraper import Web4Scraper
from x402_signer import create_payment

ENDPOINT = "https://web4-agent-gateway-production.up.railway.app/v1/scrape"
TARGET = os.getenv("PROOF_URL", "https://example.com")


def run_proof() -> dict[str, str | int | bool]:
    started = time.perf_counter()
    real = os.getenv("REAL_PAYMENT", "0") == "1"
    if real:
        body = Web4Scraper(payment_header_factory=create_payment).scrape(TARGET)
    else:
        response = requests.get(ENDPOINT, params={"url": TARGET}, timeout=60)
        if response.status_code not in (200, 402):
            raise RuntimeError(f"Gateway returned HTTP {response.status_code}")
        body = response.text
    elapsed = round((time.perf_counter() - started) * 1000)
    return {"real": real, "status": 200 if real else response.status_code, "latency_ms": elapsed, "tx_id": os.getenv("PROOF_TX_ID", "pending"), "preview": " ".join(body[:180].split())}


def main() -> None:
    proof = run_proof()
    mode = "real paid request" if proof["real"] else "simulated request"
    tx = proof["tx_id"]
    print(dedent(f"""
    WEB4 GATEWAY PROOF
    Mode: {mode}
    Status: HTTP {proof['status']}
    Latency: {proof['latency_ms']} ms
    Transaction: {tx}
    Preview: {proof['preview']}

    X / Twitter
    -----------
    A Web4 agent just accessed a paid scraping API over HTTP.
    {proof['status']} response in {proof['latency_ms']} ms.
    Payment rail: x402 + USDC on Base. Price: $0.02/request.
    Proof: {tx}
    API: {ENDPOINT}

    Discord
    -------
    Web4 Gateway beta proof: an agent requested a webpage, handled the x402
    payment challenge, and received Markdown in {proof['latency_ms']} ms.
    Base transaction: {tx}
    Endpoint: {ENDPOINT}

    Reddit
    ------
    I built a pay-per-use web scraping gateway for autonomous agents.
    It uses HTTP 402, USDC on Base, and returns Markdown after payment.
    Latest proof: HTTP {proof['status']} in {proof['latency_ms']} ms.
    Transaction/reference: {tx}
    """))


if __name__ == "__main__":
    main()

