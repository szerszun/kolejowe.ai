import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

// Permanent fixtures tied to real bugs this project hit, so none of them can silently
// come back. A few more regression assertions live alongside the feature they belong to
// (search diacritics in map.spec.ts, shared-track stations in station-details.spec.ts,
// the fake-mock-status fallback in live-feed.spec.ts) -- grouped there instead of here
// because they're easier to follow next to the feature's other tests.

const dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(dirname, "../../backend");

test.describe("Regression fixtures", () => {
  test("[CRITICAL] line 274's geometry has no duplicated/doubled segment near Janowice", async ({ request }) => {
    const res = await request.get(`http://localhost:3000/api/lines?where[id][equals]=${SEEDED.line274.id}&depth=0`);
    expect(res.ok()).toBe(true);
    const { docs } = await res.json();
    const geometry: [number, number][] = docs[0].geometry;
    expect(geometry.length).toBeGreaterThan(10);

    // Scoped to the Janowice Wielkie area specifically (not the whole 220km line): this
    // line genuinely curves back near itself elsewhere along its real mountain-terrain
    // route, which isn't a bug, so a line-wide "no near-duplicate point" check produces
    // false positives. The original bug was a doubled-back segment right at Janowice.
    const JANOWICE = { lon: 15.91876, lat: 50.8785 };
    const RADIUS_DEG = 0.05; // roughly the span of track actually near the station
    const EPS = 1e-5;

    const nearJanowice = geometry
      .map((point, index) => ({ point, index }))
      .filter(({ point: [lon, lat] }) => Math.abs(lon - JANOWICE.lon) < RADIUS_DEG && Math.abs(lat - JANOWICE.lat) < RADIUS_DEG);
    expect(nearJanowice.length).toBeGreaterThan(0); // sanity: the line does pass through here

    let duplicates = 0;
    for (let i = 1; i < nearJanowice.length; i++) {
      const [lon, lat] = nearJanowice[i].point;
      const isConsecutive = nearJanowice[i].index === nearJanowice[i - 1].index + 1;
      if (!isConsecutive) continue; // a gap means the line left and re-entered the radius legitimately
      const isNearDuplicateOfEarlier = nearJanowice
        .slice(Math.max(0, i - 10), i - 1)
        .some(({ point: [l, a] }) => Math.abs(l - lon) < EPS && Math.abs(a - lat) < EPS);
      if (isNearDuplicateOfEarlier) duplicates++;
    }
    expect(duplicates).toBe(0);
  });

  test("[CRITICAL] regression: the PLK station-dictionary matcher reads the API's real `id` field, not the old wrong `stationId` field", async () => {
    const plkApiSource = fs.readFileSync(path.join(BACKEND_ROOT, "src/lib/plkApi.ts"), "utf8");
    const matcherSource = fs.readFileSync(path.join(BACKEND_ROOT, "src/jobs/matchPlkStations.ts"), "utf8");

    // The PKP PLK dictionary endpoint only ever returns {id, name} -- not {stationId, ...}.
    // A prior version of this type claimed `stationId`, which silently wrote `undefined`
    // for every single match.
    expect(plkApiSource).toMatch(/interface\s+PlkStationDto\s*{[^}]*\bid:\s*number/s);
    expect(matcherSource).not.toMatch(/candidates\[0\]\.stationId/);
  });
});
