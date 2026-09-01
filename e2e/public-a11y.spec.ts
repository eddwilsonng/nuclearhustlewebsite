import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("guest header has Log in and Post a job, not Sign up", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Post a job" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Sign up", exact: true })).toHaveCount(
    0,
  );
});

test("homepage has one main and a skip link", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toHaveCount(1);
});

test("homepage search submits to /jobs", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Search jobs").fill("operator");
  await page.getByRole("button", { name: "Search jobs" }).click();
  await expect(page).toHaveURL(/\/jobs\?q=operator/);
  await expect(page.getByLabel("Search")).toHaveValue("operator");
});

test("job cards do not nest Save inside the title link", async ({ page }) => {
  await page.goto("/jobs");
  const card = page.locator("article").first();
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: /save job/i })).toBeVisible();
  await expect(card.locator("a button")).toHaveCount(0);
});

test("job detail exposes Apply and Save", async ({ page }) => {
  await page.goto("/jobs");
  await page.locator("article h3 a").first().click();
  await expect(page).toHaveURL(/\/job\//);
  await expect(
    page.getByRole("link", { name: /apply/i }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /save job/i })).toBeVisible();
});

test("fleet map skip link reaches the reactor list", async ({ page }) => {
  await page.goto("/status");
  await page.getByRole("link", { name: "Skip map, view reactor list" }).click();
  await expect(page.locator("#all-reactors")).toBeInViewport();
});

for (const path of ["/", "/jobs", "/login", "/about", "/status"] as const) {
  test(`axe serious+ on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });
}
