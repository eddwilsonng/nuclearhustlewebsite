import { test, expect } from "@playwright/test";
import { adminClient, testEmail, testRunId, unsubscribeToken } from "../support/testData";

test.describe.configure({ mode: "serial" });

const subscriber = testEmail(testRunId(), "alerts");

async function subscriberRow(email: string) {
  const { data } = await adminClient()
    .from("job_alert_subscribers")
    .select("email, unsubscribed_at")
    .eq("email", email)
    .maybeSingle();
  return data;
}

test("visitor can subscribe to job alerts from the homepage", async ({ page }) => {
  await page.goto("/");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Get alerts" }) }).first();
  await form.getByRole("textbox").fill(subscriber);
  await form.getByRole("button", { name: "Get alerts" }).click();

  await expect(page.getByText("You're on the Monday list.").first()).toBeVisible();
  expect(await subscriberRow(subscriber)).toMatchObject({ email: subscriber, unsubscribed_at: null });
});

test("alerts API rejects invalid emails", async ({ request }) => {
  const response = await request.post("/api/alerts", { data: { email: "not-an-email" } });
  expect(response.status()).toBe(400);
});

test("unsubscribe link with a forged token is refused", async ({ page }) => {
  const params = new URLSearchParams({ email: subscriber, token: "0".repeat(32) });
  await page.goto(`/api/alerts/unsubscribe?${params}`);
  await expect(page.getByText("Invalid or expired unsubscribe link.")).toBeVisible();
  expect((await subscriberRow(subscriber))?.unsubscribed_at).toBeNull();
});

test("unsubscribe link from the email works", async ({ page }) => {
  const params = new URLSearchParams({ email: subscriber, token: unsubscribeToken(subscriber) });
  await page.goto(`/api/alerts/unsubscribe?${params}`);
  await expect(page.getByText(/You've been unsubscribed/)).toBeVisible();
  expect((await subscriberRow(subscriber))?.unsubscribed_at).not.toBeNull();
});

test("resubscribing clears the unsubscribe, and one-click unsubscribe works", async ({ request }) => {
  const resubscribe = await request.post("/api/alerts", { data: { email: subscriber } });
  expect(resubscribe.ok()).toBe(true);
  expect((await subscriberRow(subscriber))?.unsubscribed_at).toBeNull();

  const params = new URLSearchParams({ email: subscriber, token: unsubscribeToken(subscriber) });
  const oneClick = await request.post(`/api/alerts/unsubscribe?${params}`, {
    form: { "List-Unsubscribe": "One-Click" },
  });
  expect(oneClick.ok()).toBe(true);
  expect((await subscriberRow(subscriber))?.unsubscribed_at).not.toBeNull();
});
