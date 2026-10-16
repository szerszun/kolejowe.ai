import { test, expect } from "@playwright/test";

// Default language is browser-locale-aware (src/i18n/I18nContext.tsx:
// detectInitialLanguage reads navigator.language, falling back to Polish for anything
// that isn't English), then persisted to localStorage once the user picks one explicitly.

test.describe("Internationalization", () => {
  test("[CRITICAL] defaults to Polish for a non-English browser locale", async ({ browser }) => {
    const context = await browser.newContext({ locale: "pl-PL" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByPlaceholder("Szukaj linii lub stacji")).toBeVisible({ timeout: 15_000 });
    await context.close();
  });

  test("[MAJOR] defaults to English for an English browser locale", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByPlaceholder("Search line or station")).toBeVisible({ timeout: 15_000 });
    await context.close();
  });

  test("[MAJOR] toggling language switches visible interface text", async ({ page }) => {
    // The suite's pinned locale (en-US) means this starts in English -- one click goes to
    // Polish, a second click back to English.
    await page.goto("/");
    await expect(page.getByPlaceholder("Search line or station")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /language|język/i }).click();
    await expect(page.getByPlaceholder("Szukaj linii lub stacji")).toBeVisible();

    await page.getByRole("button", { name: /language|język/i }).click();
    await expect(page.getByPlaceholder("Search line or station")).toBeVisible();
  });

  test("[MINOR] a chosen language persists across a reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Search line or station")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /language|język/i }).click();
    await expect(page.getByPlaceholder("Szukaj linii lub stacji")).toBeVisible();

    await page.reload();
    await expect(page.getByPlaceholder("Szukaj linii lub stacji")).toBeVisible({ timeout: 15_000 });
  });
});
