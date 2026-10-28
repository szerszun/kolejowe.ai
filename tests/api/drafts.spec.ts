import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { SEEDED } from "../fixtures/seeded-entities";

const API = "http://localhost:3000";
const dirname = path.dirname(fileURLToPath(import.meta.url));

// The seed generates the agent's API key into backend/.env (src/seed/ensureUsers.ts),
// locally and in CI alike.
function agentApiKey(): string {
  const env = fs.readFileSync(path.join(dirname, "../../backend/.env"), "utf8");
  const key = env.match(/^AGENT_API_KEY=(.+)$/m)?.[1]?.trim();
  if (!key) throw new Error("AGENT_API_KEY missing from backend/.env -- run `npm run seed` in backend/");
  return key;
}

// Agents (the sync jobs) write drafts; only an admin publishes them. Lines and stations
// used to be readable by anyone in full, so `?draft=true` handed anonymous visitors an
// agent's unreviewed edit. These write real drafts (agents can't delete), all named with
// the "[regression suite]" prefix so they're easy to spot in the admin UI.
test.describe("drafts stay private until published", () => {
  const agent = { Authorization: `users API-Key ${agentApiKey()}` };

  test("[CRITICAL] an agent's pending edit to a published line isn't visible anonymously", async ({ request }) => {
    const draftName = `[regression suite] unpublished draft name ${Date.now()}`;
    const edit = await request.patch(`${API}/api/lines/${SEEDED.line274.id}?draft=true&depth=0`, {
      headers: agent,
      data: { name: draftName },
    });
    expect(edit.ok()).toBe(true);

    try {
      const published = await request.get(`${API}/api/lines/${SEEDED.line274.id}?depth=0`);
      expect((await published.json()).name).toBe(SEEDED.line274.name);

      // findByID and find, both asking for the draft explicitly.
      const byId = await request.get(`${API}/api/lines/${SEEDED.line274.id}?depth=0&draft=true`);
      expect(byId.ok() ? (await byId.json()).name : null).not.toBe(draftName);
      const found = await request.get(`${API}/api/lines?where[id][equals]=${SEEDED.line274.id}&depth=0&draft=true`);
      const names = (await found.json()).docs.map((d: { name: string }) => d.name);
      expect(names).not.toContain(draftName);

      // The agent itself still sees it (the sync jobs read their own drafts back).
      const own = await request.get(`${API}/api/lines/${SEEDED.line274.id}?depth=0&draft=true`, { headers: agent });
      expect((await own.json()).name).toBe(draftName);
    } finally {
      // Another draft that matches the published name, so the admin UI doesn't show a
      // pending change on line 274 after every run.
      await request.patch(`${API}/api/lines/${SEEDED.line274.id}?draft=true&depth=0`, {
        headers: agent,
        data: { name: SEEDED.line274.name },
      });
    }
  });

  test("[CRITICAL] a never-published station doesn't appear anonymously", async ({ request }) => {
    const id = `regression-draft-${Date.now()}`;
    const created = await request.post(`${API}/api/stations?draft=true&depth=0`, {
      headers: agent,
      data: { id, name: "[regression suite] draft-only station", coordinates: [17.0, 51.1] },
    });
    expect(created.ok()).toBe(true);

    const anonById = await request.get(`${API}/api/stations/${id}?depth=0`);
    expect(anonById.status()).toBe(404);
    const anonDraft = await request.get(`${API}/api/stations/${id}?depth=0&draft=true`);
    expect(anonDraft.status()).toBe(404);
    const anonDrafts = await request.get(`${API}/api/stations?where[_status][equals]=draft&depth=0&draft=true`);
    expect((await anonDrafts.json()).totalDocs).toBe(0);

    const asAgent = await request.get(`${API}/api/stations/${id}?depth=0&draft=true`, { headers: agent });
    expect(asAgent.ok()).toBe(true);
  });
});
