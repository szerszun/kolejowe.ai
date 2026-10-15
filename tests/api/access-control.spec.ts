import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

const API = "http://localhost:3000";

test.describe("Access control", () => {
  test("[CRITICAL] public read access: lines and stations are readable with no authentication", async ({ request }) => {
    const [lines, station] = await Promise.all([
      request.get(`${API}/api/lines?limit=1`),
      request.get(`${API}/api/stations/${SEEDED.wroclawGlowny.id}`),
    ]);
    expect(lines.ok()).toBe(true);
    expect(station.ok()).toBe(true);
  });

  test("[CRITICAL] unauthenticated writes are rejected, not silently accepted", async ({ request }) => {
    const res = await request.patch(`${API}/api/lines/${SEEDED.line274.id}`, {
      data: { name: "Tampered by an unauthenticated API test" },
    });
    expect(res.ok()).toBe(false);
    expect([401, 403]).toContain(res.status());

    // Confirm the write genuinely didn't apply.
    const check = await request.get(`${API}/api/lines/${SEEDED.line274.id}`);
    const body = await check.json();
    expect(body.name).toBe(SEEDED.line274.name);
  });

  test("[CRITICAL] unauthenticated create is rejected", async ({ request }) => {
    const res = await request.post(`${API}/api/lines`, {
      data: { id: "test-should-not-be-created", number: "999", name: "Should not exist" },
    });
    expect(res.ok()).toBe(false);
  });

  test("[MAJOR] the feedback collection cannot be read without authentication (it's admin-only)", async ({ request }) => {
    const res = await request.get(`${API}/api/feedback`);
    expect([401, 403]).toContain(res.status());
  });
});
