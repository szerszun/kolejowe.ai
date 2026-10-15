import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

const API = "http://localhost:3000";

test.describe("GET /api/stations/:id", () => {
  test("[CRITICAL] returns the expected station fields", async ({ request }) => {
    const res = await request.get(`${API}/api/stations/${SEEDED.wroclawGlowny.id}?depth=1`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe(SEEDED.wroclawGlowny.name);
    expect(body).toHaveProperty("timetable");
    expect(body).toHaveProperty("arrivals");
  });

  test("[MAJOR] an unknown station id returns 404", async ({ request }) => {
    const res = await request.get(`${API}/api/stations/does-not-exist-12345`);
    expect(res.status()).toBe(404);
  });
});

test.describe("GET /api/stations/:id/live", () => {
  // Deliberately doesn't test the available:true path here -- that would call the real
  // PKP PLK API (100 req/hour quota, non-deterministic) from the gating suite. That
  // behavior is covered deterministically with a mocked response in live-feed.spec.ts.

  test("[CRITICAL] an unmatched station reports reason: not_matched, without calling the external API", async ({ request }) => {
    const res = await request.get(`${API}/api/stations/${SEEDED.unmatchedStation.id}/live`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toEqual({ available: false, reason: "not_matched" });
  });

  test("[MAJOR] an unknown station id is handled gracefully, not a 500", async ({ request }) => {
    const res = await request.get(`${API}/api/stations/does-not-exist-12345/live`);
    expect(res.status()).toBeLessThan(500);
  });
});
