import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadAnalytics(websiteId: string | undefined) {
  vi.resetModules();
  vi.stubEnv("VITE_UMAMI_WEBSITE_ID", websiteId ?? "");
  return import("./analytics");
}

type FakeScript = { defer?: boolean; src?: string; dataset: Record<string, string> };
let appended: FakeScript[];

beforeEach(() => {
  appended = [];
  // The unit tests run in Node, which has no DOM -- createElement and head.appendChild
  // are all analytics.ts uses.
  vi.stubGlobal("document", {
    createElement: () => ({ dataset: {} }),
    head: { appendChild: (el: FakeScript) => appended.push(el) },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("analytics", () => {
  it("loads nothing without a website id", async () => {
    const { initAnalytics } = await loadAnalytics(undefined);
    initAnalytics();
    expect(appended).toEqual([]);
  });

  it("adds Umami's script, deferred, with the website id", async () => {
    const { initAnalytics, UMAMI_SCRIPT_URL } = await loadAnalytics("0f5c7a1e-site");
    initAnalytics();
    expect(appended).toEqual([{ defer: true, src: UMAMI_SCRIPT_URL, dataset: { websiteId: "0f5c7a1e-site" } }]);
  });
});
