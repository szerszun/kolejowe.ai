import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";

test.describe("POST /api/feedback", () => {
  // This genuinely writes a row (delete is admin-only, and the suite has no admin
  // credential to clean up after itself) -- the distinctive "[regression suite]" prefix
  // lets an admin reviewing feedback filter these out at a glance.
  test("[MAJOR] accepts a feedback submission with no authentication", async ({ request }) => {
    const res = await request.post(`${API}/api/feedback`, {
      data: {
        message: `[regression suite] Automated test submission -- ${new Date().toISOString()}`,
        page: "/test",
        language: "en",
        userAgent: "playwright-regression-suite",
      },
    });
    expect(res.ok()).toBe(true);
  });

  test("[MAJOR] rejects a message longer than the form allows", async ({ request }) => {
    const res = await request.post(`${API}/api/feedback`, {
      data: { message: "a".repeat(2001), page: "/test" },
    });
    expect(res.status()).toBe(400);
  });

  test("[MAJOR] rejects a submission with no message", async ({ request }) => {
    const res = await request.post(`${API}/api/feedback`, {
      data: { page: "/test", language: "en" },
    });
    expect(res.ok()).toBe(false);
  });
});
