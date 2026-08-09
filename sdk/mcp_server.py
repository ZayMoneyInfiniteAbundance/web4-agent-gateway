"""MCP wrapper for the Web4 Agent Gateway.

Run with: python mcp_server.py
Dependencies: pip install mcp requests eth-account
"""
from mcp.server.fastmcp import FastMCP

from web4_scraper import Web4Scraper
from x402_signer import create_payment

mcp = FastMCP("web4-agent-gateway")


@mcp.tool()
def web4_scrape(url: str) -> str:
    """Fetch a webpage through the paid Web4 Gateway and return Markdown."""
    if not url.startswith(("http://", "https://")):
        raise ValueError("url must use http:// or https://")
    client = Web4Scraper(payment_header_factory=create_payment)
    return client.scrape(url)


if __name__ == "__main__":
    mcp.run(transport="stdio")

