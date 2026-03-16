import axios from 'axios';
import * as cheerio from 'cheerio';
import { BrowserContext, Page } from 'playwright';
import { ScrapedJob, ScraperResult, CompanyConfig } from '../types';
import { createContext, createPage, randomDelay, handleCookieConsent } from '../browser';

type CheerioRoot = ReturnType<typeof cheerio.load>;

export abstract class BaseScraper {
  protected config: CompanyConfig;
  protected maxRetries = 3;
  protected retryDelay = 2000;

  constructor(config: CompanyConfig) {
    this.config = config;
  }

  abstract scrape(): Promise<ScraperResult>;

  protected async fetchHtml(url: string): Promise<CheerioRoot> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 30000,
        });
        return cheerio.load(response.data);
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry ${i + 1}/${this.maxRetries} for ${url}: ${lastError.message}`);
        await this.sleep(this.retryDelay);
      }
    }

    throw lastError || new Error('Failed to fetch URL');
  }

  protected async fetchJson<T>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await axios.get<T>(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          timeout: 30000,
        });
        return response.data;
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry ${i + 1}/${this.maxRetries} for ${url}: ${lastError.message}`);
        await this.sleep(this.retryDelay);
      }
    }

    throw lastError || new Error('Failed to fetch URL');
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected createResult(jobs: ScrapedJob[], error?: string): ScraperResult {
    return {
      companyId: this.config.id,
      jobs,
      success: !error,
      error,
    };
  }
}

// Browser-based scraper for sites that require JavaScript rendering
export abstract class BrowserBaseScraper extends BaseScraper {
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;

  abstract scrape(): Promise<ScraperResult>;

  protected async initBrowser(): Promise<Page> {
    this.context = await createContext();
    this.page = await createPage(this.context);
    return this.page;
  }

  protected async closeBrowser(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }

  protected async navigateWithRetry(url: string, waitSelector?: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    let lastError: Error | null = null;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await handleCookieConsent(this.page);

        if (waitSelector) {
          await this.page.waitForSelector(waitSelector, { timeout: 15000 });
        } else {
          // Wait for network to be mostly idle
          await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        }

        await randomDelay(1000, 2000);
        return;
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry ${i + 1}/${this.maxRetries} for ${url}: ${lastError.message}`);
        await this.sleep(this.retryDelay);
      }
    }

    throw lastError || new Error('Failed to navigate');
  }

  protected async getPageContent(): Promise<CheerioRoot> {
    if (!this.page) throw new Error('Browser not initialized');
    const html = await this.page.content();
    return cheerio.load(html);
  }

  protected randomDelay = randomDelay;

  // Fetch job description from a job detail page
  protected async fetchJobDescription(url: string): Promise<string | null> {
    if (!this.page) return null;

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await this.sleep(1500);

      // Try multiple selectors for job description
      const selectors = [
        '[data-automation-id="jobPostingDescription"]',
        '[data-automation-id="jobDescription"]',
        '.job-description',
        '.jobDescription',
        '#job-description',
        '[class*="job-description"]',
        '[class*="description"]',
        'article',
      ];

      for (const selector of selectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const text = await element.textContent();
            if (text && text.length > 200 && text.length < 15000) {
              const cleaned = text.trim().replace(/\s+/g, ' ');
              if (!cleaned.toLowerCase().includes('cookie policy')) {
                return cleaned.slice(0, 8000);
              }
            }
          }
        } catch {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.log(`  Failed to fetch description for ${url}`);
      return null;
    }
  }
}
