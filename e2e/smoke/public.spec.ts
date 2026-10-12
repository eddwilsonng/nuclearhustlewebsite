import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

// Read-only checks, safe to point at production:
//   E2E_BASE_URL=https://www.nuclearhustle.com npx playwright test --project=smoke
// The only writes are two rate-limit rows from the apply origin check, which
// fails validation before anything else is stored.

const KEY_PAGES = [
  "/",
  "/jobs",
  "/jobs/pennsylvania",
  "/jobs/role/engineering",
  "/companies",
  "/plants",
  "/status",
  "/salary",
  "/nuclear-salary",
  "/nuclear-skills",
  "/this-week",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/sitemap",
  "/login",
  "/signup",
  "/signup/employer",
  "/signup/job-seeker",
  "/forgot-password",
];

const SITEMAP_SAMPLE_PER_FILE = 15;

function trackPageErrors(page: Page, baseURL: string): string[] {
  const siteOrigin = new URL(baseURL).origin;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500 && response.url().startsWith(siteOrigin)) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  return errors;
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]);
}

async function sitemapSample(request: APIRequestContext): Promise<string[]> {
  const index = await request.get("/sitemap.xml");
  expect(index.status()).toBe(200);
  const entries = locs(await index.text());
  const nested = entries.filter((url) => url.endsWith(".xml"));
  if (nested.length === 0) return entries.slice(0, SITEMAP_SAMPLE_PER_FILE * 4);

  const sample: string[] = [];
  for (const sitemapUrl of nested) {
    const response = await request.get(new URL(sitemapUrl).pathname);
    expect(response.status(), sitemapUrl).toBe(200);
    sample.push(...locs(await response.text()).slice(0, SITEMAP_SAMPLE_PER_FILE));
  }
  return sample;
}

for (const path of KEY_PAGES) {
  test(`${path} loads without errors`, async ({ page, baseURL }) => {
    const errors = trackPageErrors(page, baseURL!);
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveTitle(/\S/);
    expect(errors).toEqual([]);
  });
}

test("sitemap URLs resolve", async ({ request }) => {
  test.setTimeout(120_000);
  const urls = await sitemapSample(request);
  expect(urls.length).toBeGreaterThan(0);

  const failures: string[] = [];
  for (const url of urls) {
    const response = await request.get(new URL(url).pathname, { maxRedirects: 0 });
    if (response.status() >= 400) failures.push(`${response.status()} ${url}`);
  }
  expect(failures).toEqual([]);
});

test("robots.txt points at the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i);
});

test("job detail has an apply route, save button and JobPosting schema", async ({ page, baseURL }) => {
  const errors = trackPageErrors(page, baseURL!);
  await page.goto("/jobs");
  await page.locator("article h3 a").first().click();
  await expect(page).toHaveURL(/\/job\//, { timeout: 15_000 });

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /apply/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /save job/i }).first()).toBeVisible();

  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.some((json) => json.includes('"JobPosting"'))).toBe(true);
  expect(errors).toEqual([]);
});

test("unknown job slug returns 404", async ({ page }) => {
  const response = await page.goto("/job/this-job-does-not-exist-e2e");
  expect(response?.status()).toBe(404);
});

test("job search filters results", async ({ page }) => {
  await page.goto("/jobs?q=engineer");
  const titles = page.locator("article h3 a");
  await expect(titles.first()).toBeVisible();
  await expect(titles.first()).toContainText(/engineer/i);
});

test("dashboard redirects guests to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
});

test("login shows an error for wrong credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("delivered+nh-e2e-nobody@resend.dev");
  await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/invalid/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("apply endpoint accepts the site's own origins", async ({ request, baseURL }) => {
  const siteOrigin = new URL(baseURL!);
  const origins = [siteOrigin.origin];
  if (siteOrigin.hostname !== "localhost") {
    const apex = siteOrigin.hostname.replace(/^www\./, "");
    origins.push(`${siteOrigin.protocol}//${siteOrigin.hostname.startsWith("www.") ? apex : `www.${apex}`}`);
  }

  for (const origin of origins) {
    const response = await request.post("/api/apply", {
      headers: { Origin: origin },
      multipart: { jobId: "e2e-smoke", applicantName: "Smoke Test", applicantEmail: "not-an-email" },
    });
    expect(response.status(), `Origin ${origin}`).not.toBe(403);
    expect(response.status(), `Origin ${origin}`).toBe(400);
  }
});

test("alert and unsubscribe endpoints validate input", async ({ request }) => {
  const alerts = await request.post("/api/alerts", { data: { email: "not-an-email" } });
  expect(alerts.status()).toBe(400);

  const unsubscribe = await request.get("/api/alerts/unsubscribe?email=a@b.co&token=bad");
  expect(await unsubscribe.text()).toContain("Invalid or expired unsubscribe link.");
});
