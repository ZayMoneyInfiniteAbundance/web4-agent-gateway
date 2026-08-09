# Web4 Agent Gateway clients

These lightweight wrappers call the public pay-per-use scraper endpoint. They
do not embed keys and do not log private keys, headers, or signed payloads.

## TypeScript

```ts
import { Web4Scraper } from "./web4_scraper";
const client = new Web4Scraper(undefined, async (requirements) => {
  // Use the official x402 client/facilitator SDK here.
  // The signing key must come from a secret manager or environment variable.
  throw new Error("Configure official x402 SDK");
});
console.log(await client.scrape("https://example.com"));
```

## Python

```python
from web4_scraper import Web4Scraper, payment_factory_from_env
client = Web4Scraper(payment_header_factory=payment_factory_from_env)
print(client.scrape("https://example.com"))
```

The gateway advertises the payment requirements in its HTTP 402 response:
Base (`eip155:8453`), USDC, the configured pay-to address, and the endpoint
price. Install and configure the official x402 SDK for your language before
enabling real payments. Never use a treasury key in development; use a
disposable, minimally funded wallet and unset it after testing.
