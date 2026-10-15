import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

const API = "http://localhost:3000";

test.describe("GET /api/lines", () => {
  test("[CRITICAL] returns a non-empty list of lines with the expected shape", async ({ request }) => {
    const res = await request.get(`${API}/api/lines?limit=0&depth=0`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.docs)).toBe(true);
    expect(body.docs.length).toBeGreaterThan(50);

    const sample = body.docs[0];
    for (const field of ["id", "number", "name", "status", "electrified", "lengthKm", "tracks", "maxSpeedKmh"]) {
      expect(sample).toHaveProperty(field);
    }
  });

  test("[MAJOR] a known line has the fields the Overview tab depends on", async ({ request }) => {
    const res = await request.get(`${API}/api/lines?where[id][equals]=${SEEDED.line274.id}&depth=1`);
    expect(res.ok()).toBe(true);
    const { docs } = await res.json();
    expect(docs).toHaveLength(1);
    expect(docs[0].name).toBe(SEEDED.line274.name);
    expect(Array.isArray(docs[0].stations)).toBe(true);
    expect(docs[0].stations.length).toBeGreaterThan(0);
  });
});
