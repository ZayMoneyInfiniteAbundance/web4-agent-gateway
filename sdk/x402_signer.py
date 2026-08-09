"""x402 v2 Exact EVM/EIP-3009 signer.

Requires: pip install eth-account requests
The private key is read only at runtime and is never printed.
"""
from __future__ import annotations

import base64
import json
import os
import secrets
import time
from typing import Any

from eth_account import Account


EXPECTED_ASSET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"


def _key() -> str:
    value = os.environ.get("FUNDED_PRIVATE_KEY")
    if not value or not value.startswith("0x"):
        raise RuntimeError("FUNDED_PRIVATE_KEY must be supplied at runtime")
    return value


def create_payment(requirements: dict[str, Any]) -> str:
    """Return the x402 PAYMENT-SIGNATURE value as base64 JSON.

    The exact scheme must be advertised by the 402 challenge. Amount and
    recipient are taken from that challenge, never from caller overrides.
    """
    if requirements.get("network") != "eip155:8453":
        raise ValueError("Unexpected network")
    asset = requirements.get("asset") or requirements.get("extra", {}).get("asset")
    if str(asset).lower() != EXPECTED_ASSET.lower():
        raise ValueError("Unexpected USDC asset")
    private_key = _key()
    account = Account.from_key(private_key)
    now = int(time.time())
    authorization = {
        "from": account.address,
        "to": requirements["payTo"],
        "value": str(requirements.get("maxAmountRequired") or requirements.get("amount")),
        "validAfter": str(now - 60),
        "validBefore": str(now + int(requirements.get("maxTimeoutSeconds", 300))),
        "nonce": "0x" + secrets.token_hex(32),
    }
    typed_data = {
        "types": {"EIP712Domain": [
            {"name": "name", "type": "string"}, {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"}, {"name": "verifyingContract", "type": "address"}
        ], "TransferWithAuthorization": [
            {"name": "from", "type": "address"}, {"name": "to", "type": "address"},
            {"name": "value", "type": "uint256"}, {"name": "validAfter", "type": "uint256"},
            {"name": "validBefore", "type": "uint256"}, {"name": "nonce", "type": "bytes32"}
        ]},
        "primaryType": "TransferWithAuthorization",
        "domain": {"name": requirements.get("extra", {}).get("name", "USD Coin"), "version": requirements.get("extra", {}).get("version", "2"), "chainId": 8453, "verifyingContract": asset},
        "message": authorization,
    }
    signed = Account.sign_typed_data(private_key, full_message=typed_data)
    payload = {"x402Version": 2, "accepted": requirements, "payload": {"signature": signed.signature.hex(), "authorization": authorization}}
    return base64.b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()

