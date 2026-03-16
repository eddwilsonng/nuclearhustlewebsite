import { chromium, Browser, BrowserContext, Page } from 'playwright';

// Singleton browser instance for all scrapers
let browser: Browser | null = null;

// Common user agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

// Viewport sizes for randomization
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
  }
  return browser;
}

export async function createContext(): Promise<BrowserContext> {
  const b = await getBrowser();
  const viewport = getRandomItem(VIEWPORTS);
  const userAgent = getRandomItem(USER_AGENTS);

  const context = await b.newContext({
    userAgent,
    viewport,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: [],
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  // Remove webdriver flag to avoid detection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    // Additional fingerprint masking
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  return context;
}

export async function createPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Utility for random delays (human-like behavior)
export function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Handle common cookie consent dialogs
export async function handleCookieConsent(page: Page): Promise<void> {
  const consentSelectors = [
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("Accept Cookies")',
    'button:has-text("I Accept")',
    'button:has-text("Agree")',
    '[data-testid="cookie-accept"]',
    '#onetrust-accept-btn-handler',
    '.cookie-accept',
    '.accept-cookies',
  ];

  for (const selector of consentSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click();
        await randomDelay(500, 1000);
        break;
      }
    } catch {
      // Selector not found, continue
    }
  }
}
