"""Minimal Web4 Agent Gateway client.

Payment signing is delegated to the official x402 client implementation when
available; this client never accepts or logs a private key in source code.
"""
from __future__ import annotations

import os
from typing import Any, Callable, Optional

import requests


class Web4ScraperError(RuntimeError):
    pass


class Web4Scraper:
    def __init__(self, base_url: str = "https://web4-agent-gateway-production.up.railway.app/v1/scrape", *, timeout: float = 60, payment_header_factory: Optional[Callable[[dict[str, Any]], str]] = None):
        self.base_url = base_url
        self.timeout = timeout
        self.payment_header_factory = payment_header_factory

    def scrape(self, url: str) -> str:
        response = requests.get(self.base_url, params={"url": url}, timeout=self.timeout)
        if response.status_code == 200:
            return response.text
        if response.status_code != 402:
            raise Web4ScraperError(f"Gateway returned HTTP {response.status_code}")
        if not self.payment_header_factory:
            raise Web4ScraperError("HTTP 402 received. Configure an official x402 payment_header_factory.")
        requirements = {**response.headers, "body": response.text}
        payment = self.payment_header_factory(requirements)
        paid = requests.get(self.base_url, params={"url": url}, headers={"X-402-Payment-Signature": payment}, timeout=self.timeout)
        if paid.status_code != 200:
            raise Web4ScraperError(f"Paid request returned HTTP {paid.status_code}")
        return paid.text


def payment_factory_from_env(requirements: dict[str, Any]) -> str:
    """Hook for an official x402 SDK; never logs the key or signed payload."""
    if not os.environ.get("FUNDED_PRIVATE_KEY"):
        raise Web4ScraperError("FUNDED_PRIVATE_KEY is required only at runtime for payment signing")
    raise NotImplementedError("Install/configure the official x402 Python client for EIP-712 signing")
