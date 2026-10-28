import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

const API = "http://localhost:3000";

type Movement = { lineId: unknown };
type StationDoc = { timetable?: Movement[] | null; arrivals?: Movement[] | null };

function movements(station: StationDoc): Movement[] {
  return [...(station.timetable ?? []), ...(station.arrivals ?? [])];
}

// Lines -> stations -> timetable entries -> lines (with full geometry) is a relationship
// loop. At Payload's default depth of 2, an anonymous `/api/lines?limit=0` produced a
// response past V8's max string length and took the production backend down (out of
// memory on Render). maxDepth: 1 in payload.config.ts and maxDepth: 0 on the movement
// lineId field in Stations.ts keep it bounded. Every other API test passes an explicit
// depth, which is how this slipped through -- these deliberately don't, or ask for more.
test.describe("relationship depth caps", () => {
  test("[CRITICAL] /api/lines?limit=0 with the default depth succeeds", async ({ request }) => {
    const res = await request.get(`${API}/api/lines?limit=0`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.docs.length).toBeGreaterThan(50);
  });

  test("[CRITICAL] a negative limit (treated as no limit) succeeds", async ({ request }) => {
    const res = await request.get(`${API}/api/lines?limit=-5`);
    expect(res.status()).toBe(200);
  });

  test("[CRITICAL] depth above 1 is capped: stations inside a line don't populate their lines", async ({ request }) => {
    const res = await request.get(`${API}/api/lines?where[id][equals]=${SEEDED.line274.id}&depth=5`);
    expect(res.ok()).toBe(true);
    const { docs } = await res.json();
    const stations: StationDoc[] = docs[0].stations;
    // Populated at depth 1 -- the frontend's fetchLines needs station names/coordinates.
    expect(typeof stations[0]).toBe("object");
    const entries = stations.flatMap(movements);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expect(typeof entry.lineId).toBe("string");
  });

  test("[MAJOR] station details at depth 1 return movement lineIds as plain ids", async ({ request }) => {
    const res = await request.get(`${API}/api/stations/${SEEDED.wroclawGlowny.id}?depth=1`);
    expect(res.ok()).toBe(true);
    const entries = movements(await res.json());
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expect(typeof entry.lineId).toBe("string");
  });
});
