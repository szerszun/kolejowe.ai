import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

test.describe("Station details panel", () => {
  test("[CRITICAL] opens from a deep link and shows the Overview tab by default", async ({ page }) => {
    await page.goto(`/station/${SEEDED.wroclawGlowny.id}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByRole("heading", { name: SEEDED.wroclawGlowny.name })).toBeVisible();
    await expect(panel.getByRole("tab", { name: /overview/i, exact: false })).toHaveAttribute("aria-selected", "true");
  });

  test("[CRITICAL] has all four tabs: Overview, Arrivals, Departures, Timetable", async ({ page }) => {
    await page.goto(`/station/${SEEDED.wroclawGlowny.id}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    for (const name of [/overview/i, /arrivals/i, /departures/i, /timetable/i]) {
      await expect(panel.getByRole("tab", { name })).toBeVisible();
    }
  });

  test("[MAJOR] Timetable tab is searchable", async ({ page }) => {
    await page.goto(`/station/${SEEDED.wroclawGlowny.id}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await panel.getByRole("tab", { name: /timetable/i }).click();
    const search = panel.getByPlaceholder(/destination|operator|line/i);
    await expect(search).toBeVisible();
    const rowsBefore = await panel.locator(".timetable-row").count();
    await search.fill("zzzz-no-such-destination-zzzz");
    await expect(panel.getByText(/no connections match/i)).toBeVisible();
    expect(rowsBefore).toBeGreaterThan(0);
  });

  test("[CRITICAL] regression: a shared-track station lists every line that serves it, not just one", async ({ page }) => {
    await page.goto(`/station/${SEEDED.sharedTrackStation.id}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    for (const number of SEEDED.sharedTrackStation.servingLineNumbers) {
      await expect(panel.getByText(number, { exact: true })).toBeVisible();
    }
  });

  test("[CRITICAL] shows a connectivity-error message (not a misleading \"no data\" message) when the backend is unreachable", async ({ page }) => {
    await page.route("**/api/stations/**", (route) => route.abort("failed"));
    await page.goto(`/station/${SEEDED.wroclawGlowny.id}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel.getByText(/couldn.t connect|unable to connect|connection/i)).toBeVisible({ timeout: 15_000 });
  });
});
