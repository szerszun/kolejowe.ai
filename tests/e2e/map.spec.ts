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
    await expect(page.locator(".line-list-header")).toBeVisible({ timeout: 15_000 });
    const countText = await page.locator(".line-list-header").textContent();
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
    const before = Number((await page.locator(".line-list-header").textContent())?.match(/\d+/)?.[0]);

    // Deselect every status except one -- the chips are multi-select toggles, all start active.
    await page.getByRole("button", { name: /freight only/i }).click();
    await page.getByRole("button", { name: /planned/i }).click();
    await page.getByRole("button", { name: /closed/i }).click();

    const after = Number((await page.locator(".line-list-header").textContent())?.match(/\d+/)?.[0]);
    expect(after).toBeLessThan(before);
  });

  test("[MAJOR] clicking the kolejowe.ai logo returns to the home view from a selected line", async ({ page }) => {
    await page.goto(`/line/${SEEDED.line274.number}`);
    await expect(page.getByRole("heading", { name: SEEDED.line274.name })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "kolejowe.ai" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: SEEDED.line274.name })).not.toBeVisible();
  });

  test("[MINOR] the map legend can be collapsed and expanded again", async ({ page }) => {
    await page.goto("/");
    const legend = page.locator(".legend");
    await expect(legend.getByText("Active passenger")).toBeVisible({ timeout: 15_000 });

    const toggle = legend.getByRole("button", { name: /collapse legend/i });
    await toggle.click();
    await expect(legend.getByText("Active passenger")).not.toBeVisible();

    await legend.getByRole("button", { name: /expand legend/i }).click();
    await expect(legend.getByText("Active passenger")).toBeVisible();
  });

  test.describe("find-me geolocation control", () => {
    test.use({ geolocation: { latitude: 51.1079, longitude: 17.0385 }, permissions: ["geolocation"] });

    test("[MAJOR] clicking find-me centers the map on the user's location", async ({ page }) => {
      await page.goto("/");
      await page.locator(".line-list-header").waitFor({ timeout: 15_000 });

      await page.locator(".maplibregl-ctrl-geolocate").click();

      // MapLibre's GeolocateControl renders a dot marker at the resolved position once
      // geolocation succeeds -- the most direct signal available from the DOM that the
      // fly-to actually completed, without reaching into the map's internal camera state.
      await expect(page.locator(".maplibregl-user-location-dot")).toBeVisible({ timeout: 10_000 });
    });
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

  test.describe("mobile viewport (390x844)", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    // Regression: the header had no mobile layout at all -- the subtitle wrapped across
    // 2-3 lines and the action buttons (including the language toggle) rendered with
    // their left edge past the viewport's right edge, making them entirely unreachable.
    test("[CRITICAL] regression: every header button stays within the viewport", async ({ page }) => {
      await page.goto("/");
      await page.locator(".line-list-header").waitFor({ timeout: 15_000 });
      for (const name of [/about/i, /feedback/i, /language|język/i]) {
        const box = await page.getByRole("button", { name }).boundingBox();
        expect(box, `button matching ${name} has no bounding box`).toBeTruthy();
        expect(box!.x + box!.width).toBeLessThanOrEqual(390);
      }
    });

    // Regression: the explorer panel (search/filters/list) used to occupy a fixed 40vh
    // row above the map, but the search box and filter chips alone filled nearly all of
    // that budget -- the actual scrollable list measured ~23px tall, under one row, so
    // nothing in it could be browsed or tapped. It's now a collapsed-by-default bottom
    // sheet over a full-height map, expanding on tap.
    test("[CRITICAL] regression: the line list is collapsed by default and expands to a usable size on tap", async ({ page }) => {
      await page.goto("/");
      const handle = page.locator(".explorer-handle");
      await expect(handle).toBeVisible({ timeout: 15_000 });
      await expect(handle).toHaveAttribute("aria-expanded", "false");

      const collapsedBox = await page.locator(".explorer-panel").boundingBox();
      expect(collapsedBox!.height).toBeLessThan(100); // just the handle, not a usable list

      await handle.tap();
      await expect(handle).toHaveAttribute("aria-expanded", "true");
      const firstLine = page.getByRole("option").first();
      await expect(firstLine).toBeVisible();
      const lineBox = await firstLine.boundingBox();
      expect(lineBox!.height).toBeGreaterThan(20); // a real, tappable row, not a sliver
    });

    test("[MAJOR] tapping the backdrop collapses the expanded sheet", async ({ page }) => {
      await page.goto("/");
      await page.locator(".explorer-handle").tap();
      await expect(page.locator(".explorer-handle")).toHaveAttribute("aria-expanded", "true");

      await page.locator(".explorer-backdrop").tap({ position: { x: 10, y: 10 } });
      await expect(page.locator(".explorer-handle")).toHaveAttribute("aria-expanded", "false");
    });

    test("[MAJOR] selecting a line from the expanded sheet opens its details and collapses the sheet", async ({ page }) => {
      await page.goto("/");
      await page.locator(".explorer-handle").tap();
      await page.getByRole("option", { name: new RegExp(SEEDED.line274.name) }).tap();

      await expect(page.locator("aside.details-panel")).toBeVisible({ timeout: 15_000 });
      await expect(page.locator(".explorer-handle")).toHaveAttribute("aria-expanded", "false");
    });
  });
});
