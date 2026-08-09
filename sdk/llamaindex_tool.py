"""LlamaIndex FunctionTool for the Web4 paid scraper."""
from llama_index.core.tools import FunctionTool

from web4_scraper import Web4Scraper
from x402_signer import create_payment


def web4_scrape(url: str) -> str:
    """Retrieve an HTTP(S) URL as Markdown through the Web4 Gateway."""
    if not url.startswith(("http://", "https://")):
        raise ValueError("url must use http:// or https://")
    try:
        return Web4Scraper(payment_header_factory=create_payment).scrape(url)
    except Exception as exc:
        raise RuntimeError(f"Web4 scrape failed: {exc}") from exc


web4_scrape_tool = FunctionTool.from_defaults(
    fn=web4_scrape,
    name="web4_scrape",
    description="Retrieve a webpage as Markdown through the paid Web4 Agent Gateway.",
)

