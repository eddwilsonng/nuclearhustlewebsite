import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

const LOCAL_URL = "http://localhost:3000";
const baseURL = process.env.E2E_BASE_URL || LOCAL_URL;
const isRemote = baseURL !== LOCAL_URL;

// localhost, not 127.0.0.1: /api/apply only accepts the NEXT_PUBLIC_SITE_URL
// origin, which is http://localhost:3000 in .env.local.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: { timeout: process.env.E2E_DEV ? 20_000 : 10_000 },
  globalSetup: isRemote ? undefined : "./e2e/support/global-setup.ts",
  globalTeardown: isRemote ? undefined : "./e2e/support/global-teardown.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // A production build by default: the dev server stalls when parallel tests
  // hit uncompiled routes. E2E_DEV=1 uses `next dev` for faster iteration.
  webServer: isRemote
    ? undefined
    : {
        command: process.env.E2E_DEV ? "npx next dev" : "npx next build && npx next start",
        url: LOCAL_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 600_000,
      },
  projects: isRemote
    ? [
        {
          name: "smoke",
          testMatch: /e2e\/smoke\/.+\.spec\.ts$/,
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "chromium",
          testMatch: /e2e\/[^/]+\.spec\.ts$/,
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "flows",
          testMatch: /e2e\/flows\/.+\.spec\.ts$/,
          fullyParallel: false,
          timeout: 90_000,
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "smoke",
          testMatch: /e2e\/smoke\/.+\.spec\.ts$/,
          use: { ...devices["Desktop Chrome"] },
        },
      ],
});
