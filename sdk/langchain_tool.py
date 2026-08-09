"""LangChain tool for the Web4 paid scraper."""
from typing import Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from web4_scraper import Web4Scraper
from x402_signer import create_payment


class Web4ScrapeInput(BaseModel):
    url: str = Field(description="HTTP or HTTPS URL to retrieve as Markdown")


class Web4ScrapeTool(BaseTool):
    name: str = "web4_scrape"
    description: str = "Retrieve a webpage as Markdown through the paid Web4 Agent Gateway."
    args_schema: Type[BaseModel] = Web4ScrapeInput

    def _run(self, url: str) -> str:
        if not url.startswith(("http://", "https://")):
            raise ValueError("url must use http:// or https://")
        try:
            return Web4Scraper(payment_header_factory=create_payment).scrape(url)
        except Exception as exc:
            raise RuntimeError(f"Web4 scrape failed: {exc}") from exc

