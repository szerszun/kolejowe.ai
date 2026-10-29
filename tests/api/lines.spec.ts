import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

const API = "http://localhost:3000";
const dirname = path.dirname(fileURLToPath(import.meta.url));

// The seed writes the agent's API key into backend/.env (see drafts.spec.ts).
function agentApiKey(): string {
  const env = fs.readFileSync(path.join(dirname, "../../backend/.env"), "utf8");
  const key = env.match(/^AGENT_API_KEY=(.+)$/m)?.[1]?.trim();
  if (!key) throw new Error("AGENT_API_KEY missing from backend/.env -- run `npm run seed` in backend/");
  return key;
}

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

// What the home page map loads (fetchLines). The plain `?limit=0&depth=1` embeds every
// station's whole timetable -- 8.9 MB and ~20 s per page load in production.
test.describe("GET /api/lines/map", () => {
  test("[CRITICAL] returns every line with stations cut down to id, name and coordinates", async ({ request }) => {
    const res = await request.get(`${API}/api/lines/map`);
    expect(res.ok()).toBe(true);
    const { docs } = await res.json();
    expect(docs.length).toBeGreaterThan(50);

    const line = docs.find((d: { id: string }) => d.id === SEEDED.line274.id);
    expect(line.name).toBe(SEEDED.line274.name);
    expect(line.geometry).toBeTruthy();
    expect(line.stations.length).toBeGreaterThan(0);
    for (const station of line.stations) {
      expect(Object.keys(station).sort()).toEqual(["coordinates", "id", "name"]);
      expect(station.coordinates).toHaveLength(2);
    }
  });

  // An absolute bound rather than a comparison with the full list: fetching that 8.7 MB
  // response too slowed the shared dev backend enough to time out other tests. The seeded
  // data comes to ~1.2 MB trimmed vs ~8.7 MB with full stations.
  test("[MAJOR] stays far smaller than the fully populated list", async ({ request }) => {
    const res = await request.get(`${API}/api/lines/map`);
    expect((await res.body()).length).toBeLessThan(3_000_000);
  });

  // The logged-out response is cached in the backend (Lines.ts) and may be cached by
  // browsers for a minute; a logged-in editor's isn't, since it can include drafts.
  test("[MAJOR] is cacheable for visitors, but not for a logged-in editor", async ({ request }) => {
    const anon = await request.get(`${API}/api/lines/map`);
    expect(anon.headers()["cache-control"]).toBe("public, max-age=60");

    const editor = await request.get(`${API}/api/lines/map`, { headers: { Authorization: `users API-Key ${agentApiKey()}` } });
    expect(editor.ok()).toBe(true);
    expect(editor.headers()["cache-control"] ?? "").not.toContain("public");
  });

  test("[CRITICAL] an agent's draft station rename never reaches the cached public map", async ({ request }) => {
    const station = SEEDED.sharedTrackStation;
    const stationName = async () => {
      const { docs } = await (await request.get(`${API}/api/lines/map`)).json();
      const line = docs.find((d: { id: string }) => d.id === SEEDED.line274.id);
      return line.stations.find((s: { id: string }) => s.id === station.id)?.name;
    };
    expect(await stationName()).toBe(station.name); // fills the cache

    const agent = { Authorization: `users API-Key ${agentApiKey()}` };
    const draftName = `[regression suite] draft station name ${Date.now()}`;
    const edit = await request.patch(`${API}/api/stations/${station.id}?draft=true&depth=0`, { headers: agent, data: { name: draftName } });
    expect(edit.ok()).toBe(true);
    try {
      expect(await stationName()).toBe(station.name); // rebuilt after the save, still published data only
    } finally {
      await request.patch(`${API}/api/stations/${station.id}?draft=true&depth=0`, { headers: agent, data: { name: station.name } });
    }
  });
});
