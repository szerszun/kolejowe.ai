import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { SEEDED } from "../fixtures/seeded-entities";

// Scoped to the WCAG 2.0/2.1 A+AA rule sets (axe's own "best-practice" rules
// are opinionated beyond the standard and noisy for a map-heavy UI -- not
// included here). MapLibre's own canvas/attribution controls are third-party
// markup we don't own, so a finding inside `.maplibregl-map` is excluded
// rather than ignored outright -- it's still worth knowing about, just not
// something a fix in this codebase can resolve.
async function scan(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude(".maplibregl-map").analyze();
}

test.describe("Accessibility", () => {
  test("[MAJOR] home/map view has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/lines found/i)).toBeVisible({ timeout: 15_000 });
    const results = await scan(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("[MAJOR] line details panel has no WCAG A/AA violations", async ({ page }) => {
    await page.goto(`/line/${SEEDED.line274.number}`);
    await expect(page.getByRole("heading", { name: SEEDED.line274.name })).toBeVisible({ timeout: 15_000 });
    const results = await scan(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("[MAJOR] station details panel has no WCAG A/AA violations", async ({ page }) => {
    await page.goto(`/station/${SEEDED.wroclawGlowny.id}`);
    await expect(page.getByRole("heading", { name: SEEDED.wroclawGlowny.name })).toBeVisible({ timeout: 15_000 });
    const results = await scan(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
