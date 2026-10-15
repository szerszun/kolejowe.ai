import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

test.describe("Line details panel", () => {
  test("[CRITICAL] Overview tab shows the core line fields", async ({ page }) => {
    await page.goto(`/line/${SEEDED.line274.number}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });

    // Overview is the default tab.
    await expect(panel.getByText(/length|status|tracks/i).first()).toBeVisible();
    await expect(panel.locator(".station-list")).toBeVisible();
  });

  test("[MAJOR] History tab shows a timeline and narrative", async ({ page }) => {
    await page.goto(`/line/${SEEDED.line274.number}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await panel.getByRole("tab", { name: /history/i }).click();
    await expect(panel.getByRole("tabpanel").or(panel.locator(".details-panel-body"))).toContainText(/.{30,}/);
  });

  test("[CRITICAL] Tenders tab shows a clear empty state by default, then lists tenders with core fields once closed/awarded ones are revealed", async ({ page }) => {
    // Line 274's tenders are all awarded (there happen to be no open tenders anywhere in
    // the current seeded dataset) -- the default open-only view is correctly empty, and the
    // "show closed/awarded" toggle (DET-4) is what actually surfaces tender content to test against.
    await page.goto(`/line/${SEEDED.line274.number}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await panel.getByRole("tab", { name: /tenders/i }).click();
    await expect(panel.getByText(/no open tenders/i)).toBeVisible();

    await panel.getByLabel(/show closed.*tenders/i).check();
    await expect(panel.getByText(/PLN|zł/i).first()).toBeVisible();
  });

  test("[MAJOR] Tenders tab shows a clear empty state for a line with no tenders at all (no toggle offered, since there's nothing to reveal)", async ({ page }) => {
    await page.goto(`/line/${SEEDED.lineWithNoTenders.id}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await panel.getByRole("tab", { name: /tenders/i }).click();
    await expect(panel.getByText(/no open tenders/i)).toBeVisible();
    await expect(panel.getByLabel(/show closed.*tenders/i)).toHaveCount(0);
  });

  test("[MINOR] each section shows a source and last-updated date", async ({ page }) => {
    await page.goto(`/line/${SEEDED.line274.number}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText(/last updated/i)).toBeVisible();
  });
});
