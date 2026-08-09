export type PaymentHeaderFactory = (requirements: Record<string, string>) => Promise<string>;

export class Web4ScraperError extends Error {}

export class Web4Scraper {
  constructor(
    private readonly endpoint = "https://web4-agent-gateway-production.up.railway.app/v1/scrape",
    private readonly paymentHeaderFactory?: PaymentHeaderFactory,
  ) {}

  async scrape(url: string): Promise<string> {
    const first = await fetch(`${this.endpoint}?url=${encodeURIComponent(url)}`);
    if (first.status === 200) return first.text();
    if (first.status !== 402) throw new Web4ScraperError(`Gateway returned HTTP ${first.status}`);
    if (!this.paymentHeaderFactory) throw new Web4ScraperError("Configure an official x402 payment client");
    const requirements = Object.fromEntries(first.headers.entries());
    requirements.body = await first.text();
    const payment = await this.paymentHeaderFactory(requirements);
    const paid = await fetch(`${this.endpoint}?url=${encodeURIComponent(url)}`, {
      headers: { "X-402-Payment-Signature": payment },
    });
    if (paid.status !== 200) throw new Web4ScraperError(`Paid request returned HTTP ${paid.status}`);
    return paid.text();
  }
}
