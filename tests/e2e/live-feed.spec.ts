import { test, expect, type Page } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

// The gating suite never calls the real PKP PLK API (100 req/hour quota, non-deterministic
// content). Every scenario here mocks GET /api/stations/:id/live directly, so these tests
// are deterministic, fast, and never touch the real feed's quota.

function mockLive(page: Page, body: Record<string, unknown>) {
  return page.route("**/api/stations/*/live", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }),
  );
}

async function openDepartures(page: Page, stationId: string) {
  await page.goto(`/station/${stationId}`);
  const panel = page.locator("aside.details-panel");
  await expect(panel).toBeVisible({ timeout: 15_000 });
  await panel.getByRole("tab", { name: /departures/i }).click();
  return panel;
}

test.describe("Live PKP PLK feed", () => {
  test("[CRITICAL] defaults to the live view (Timetable time unchecked)", async ({ page }) => {
    await mockLive(page, { available: true, stale: false, movements: [] });
    const panel = await openDepartures(page, SEEDED.wroclawGlowny.id);
    await expect(panel.getByLabel(/timetable time/i)).not.toBeChecked();
  });

  test("[CRITICAL] a matched live movement shows a LIVE tag and real status, not a fabricated one", async ({ page }) => {
    const now = new Date();
    const hhmm = (d: Date) => d.toTimeString().slice(0, 5);
    const soon = new Date(now.getTime() + 10 * 60_000);

    await mockLive(page, {
      available: true,
      stale: false,
      movements: [
        {
          scheduledArrival: null,
          scheduledDeparture: soon.toISOString(),
          actualArrival: null,
          actualDeparture: soon.toISOString(),
          arrivalDelayMinutes: null,
          departureDelayMinutes: 0,
          cancelled: false,
        },
      ],
    });

    // Stub the station-details fetch (a single path segment after /stations/, distinct from
    // the /live route above) so there's a departure at the same time for the live movement to match.
    await page.route("**/api/stations/*", async (route) => {
      const res = await route.fetch();
      const json = await res.json();
      json.timetable = [
        { id: "mock-1", time: hhmm(soon), lineId: "274", destination: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      ];
      await route.fulfill({ response: res, json });
    });

    const panel = await openDepartures(page, SEEDED.wroclawGlowny.id);
    await expect(panel.getByText(/live/i).first()).toBeVisible({ timeout: 10_000 });

    // React StrictMode double-invokes effects in dev, so a second station-details fetch
    // can still be in flight through this route handler after the assertion above already
    // passed -- let it finish or be dropped quietly instead of throwing during teardown.
    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  test("[CRITICAL] an unmatched station falls back to the plain timetable with no fabricated status badge", async ({ page }) => {
    await mockLive(page, { available: false, reason: "not_matched" });
    const panel = await openDepartures(page, SEEDED.unmatchedStation.id);
    await expect(panel.locator(".badge")).toHaveCount(0);
  });

  test("[CRITICAL] regression: when the feed is rate-limited, the app shows a warning and forces the static timetable (never a fabricated status)", async ({ page }) => {
    await mockLive(page, { available: false, reason: "rate_limited" });
    const panel = await openDepartures(page, SEEDED.wroclawGlowny.id);
    await expect(panel.getByText(/dynamic data is currently unavailable|currently unavailable/i)).toBeVisible({ timeout: 10_000 });
    await expect(panel.locator(".badge")).toHaveCount(0);
  });

  test("[MAJOR] when the upstream API doesn't respond, the app shows the same unavailable warning", async ({ page }) => {
    await mockLive(page, { available: false, reason: "upstream_error" });
    const panel = await openDepartures(page, SEEDED.wroclawGlowny.id);
    await expect(panel.getByText(/currently unavailable/i)).toBeVisible({ timeout: 10_000 });
  });

  test("[MAJOR] a manual toggle switches back to the static timetable at any time", async ({ page }) => {
    await mockLive(page, { available: true, stale: false, movements: [] });
    const panel = await openDepartures(page, SEEDED.wroclawGlowny.id);
    const checkbox = panel.getByLabel(/timetable time/i);
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(panel.locator(".live-tag")).toHaveCount(0);
  });
});
