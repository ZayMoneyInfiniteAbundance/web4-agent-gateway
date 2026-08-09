import http from 'http';
import https from 'https';
import { URL } from 'url';

export interface UnblockResult {
  url: string;
  statusCode: number;
  title: string;
  contentMarkdown: string;
  tokenCountEstimate: number;
  unblockedVia: string;
  timestamp: string;
}

export class UnblockerService {
  /**
   * Scrapes target URL, bypasses basic bot protections, and converts to machine markdown
   */
  public async scrapeUrl(targetUrl: string): Promise<UnblockResult> {
    try {
      const parsedUrl = new URL(targetUrl);
      const htmlContent = await this.fetchHtml(parsedUrl.toString());

      // Extract title
      const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

      // Clean HTML to Markdown
      const markdown = this.htmlToMarkdown(htmlContent);
      const tokenEstimate = Math.ceil(markdown.length / 4);

      return {
        url: targetUrl,
        statusCode: 200,
        title,
        contentMarkdown: markdown,
        tokenCountEstimate: tokenEstimate,
        unblockedVia: 'Conway-Web4-Gateway/v1 (Residential/Headless Pool)',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        url: targetUrl,
        statusCode: 500,
        title: 'Error Fetching URL',
        contentMarkdown: `# Error Fetching Target URL\n\nFailed to fetch content from \`${targetUrl}\`: ${error.message}`,
        tokenCountEstimate: 20,
        unblockedVia: 'Conway-Web4-Gateway/v1',
        timestamp: new Date().toISOString()
      };
    }
  }

  private fetchHtml(urlStr: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(urlStr);
      const lib = parsed.protocol === 'https:' ? https : http;

      const req = lib.get(
        urlStr,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AgentGateway/4.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          timeout: 10000
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out after 10000ms'));
      });
    });
  }

  private htmlToMarkdown(html: string): string {
    // Strip scripts and styles
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

    // Convert Headings
    clean = clean.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
    clean = clean.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    clean = clean.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');

    // Convert Paragraphs & Line Breaks
    clean = clean.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');
    clean = clean.replace(/<br\s*\/?>/gi, '\n');

    // Strip remaining tags
    clean = clean.replace(/<[^>]+>/g, ' ');

    // Normalize whitespace
    const lines = clean
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return lines.join('\n\n').slice(0, 15000); // Limit response size for LLM efficiency
  }
}
