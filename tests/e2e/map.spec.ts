import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

// Canvas-level interactions (hovering a rendered line feature on the MapLibre canvas,
// station markers appearing past zoom 10, the tender badge marker) aren't covered here --
// they'd need brittle pixel-position hit-testing or visual-diff snapshots for marginal
// value. Everything that drives or reacts to map state through the DOM (search, filters,
// selection, URL sync, responsive layout) is covered.

test.describe("Interactive map", () => {
  test("[CRITICAL] loads the map and the full line list", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/lines found/i)).toBeVisible({ timeout: 15_000 });
    const countText = await page.getByText(/lines found/i).textContent();
    const count = Number(countText?.match(/\d+/)?.[0]);
    expect(count).toBeGreaterThan(50); // sanity floor, not pinned to an exact count
  });

  test("[CRITICAL] clicking a line in the list opens its details panel and updates the URL", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("option", { name: new RegExp(SEEDED.line274.name) }).click();
    await expect(page).toHaveURL(new RegExp(`/line/${SEEDED.line274.number}$`));
    await expect(page.getByRole("heading", { name: SEEDED.line274.name })).toBeVisible();
  });

  test("[CRITICAL] a direct link to a line (deep link) opens that line's panel on load", async ({ page }) => {
    await page.goto(`/line/${SEEDED.line274.number}`);
    await expect(page.getByRole("heading", { name: SEEDED.line274.name })).toBeVisible({ timeout: 15_000 });
  });

  test("[MAJOR] regression: searching a diacritics-free term still matches accented station names", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/search line or station/i).fill(SEEDED.diacriticsSearch.query);
    const stationResults = page.getByRole("listbox", { name: /stations/i }).getByRole("option");
    await expect(stationResults.first()).toBeVisible();
    const names = await stationResults.allTextContents();
    expect(names.some((n) => n.startsWith(SEEDED.diacriticsSearch.expectedNamePrefix))).toBe(true);
  });

  test("[MAJOR] status filter chips narrow the line list", async ({ page }) => {
    await page.goto("/");
    const before = Number((await page.getByText(/lines found/i).textContent())?.match(/\d+/)?.[0]);

    // Deselect every status except one -- the chips are multi-select toggles, all start active.
    await page.getByRole("button", { name: /freight only/i }).click();
    await page.getByRole("button", { name: /planned/i }).click();
    await page.getByRole("button", { name: /closed/i }).click();

    const after = Number((await page.getByText(/lines found/i).textContent())?.match(/\d+/)?.[0]);
    expect(after).toBeLessThan(before);
  });

  test("[MAJOR] clicking the kolejowe.ai logo returns to the home view from a selected line", async ({ page }) => {
    await page.goto(`/line/${SEEDED.line274.number}`);
    await expect(page.getByRole("heading", { name: SEEDED.line274.name })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "kolejowe.ai" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: SEEDED.line274.name })).not.toBeVisible();
  });

  test("[MINOR] mobile viewport: selecting a line shows the details panel as a bottom sheet layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/line/${SEEDED.line274.number}`);
    const panel = page.locator("aside.details-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    const box = await panel.boundingBox();
    // A bottom sheet spans close to the full viewport width, unlike the desktop side panel.
    expect(box?.width).toBeGreaterThan(350);
  });
});
