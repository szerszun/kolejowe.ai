import { defineConfig, devices } from "@playwright/test";

const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // The backend under test is a single dev-mode Next.js/Payload process backed by SQLite --
  // capping workers avoids overwhelming it (confirmed empirically: tests that fail under
  // higher parallelism pass reliably at this level).
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["json", { outputFile: "test-results/e2e.json" }], ["html", { outputFolder: "test-results/playwright-html", open: "never" }]]
    : [["list"], ["json", { outputFile: "test-results/e2e.json" }], ["html", { outputFolder: "test-results/playwright-html", open: "never" }]],
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Pinned explicitly: the app's default language follows navigator.language (see
    // src/i18n/I18nContext.tsx), and an unpinned locale makes every test that doesn't
    // care about language non-deterministic across machines/CI. i18n.spec.ts's own
    // locale-detection tests override this per-context, so they're unaffected.
    locale: "en-US",
  },
  projects: [
    { name: "e2e", testDir: "./tests/e2e", testIgnore: /build-smoke\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "api", testDir: "./tests/api" },
    // Builds and serves the real production bundle itself -- see build-smoke.spec.ts for why.
    { name: "build-smoke", testDir: "./tests/e2e", testMatch: /build-smoke\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: ".",
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      cwd: "./backend",
      url: `${BACKEND_URL}/api/lines?limit=1`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // Lets build-smoke.spec.ts's production-preview server (a different origin/port
      // than the dev frontend) through CORS too.
      env: { CORS_ORIGINS: "http://localhost:4174" },
    },
  ],
});
