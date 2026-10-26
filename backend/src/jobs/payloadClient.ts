/**
 * Shared REST helpers for the scheduled agent jobs (geometry sync, overview
 * verify, history verify). Every job authenticates the same way a real
 * external cron box would have to -- the agent's own API key over REST, not
 * the trusted Local API -- so this lives in one place instead of being
 * copy-pasted per job.
 */
export const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000'

/**
 * For the idempotent writes the timetable sync makes (PATCH a station, POST the
 * timetable-info global): retries a 5xx with backoff instead of failing outright. Render
 * answered the final timetable-info write of a ~35-minute sync with a 502 and the whole
 * run was lost; the backend was healthy again seconds later.
 */
const RETRY_DELAYS_MS = [5_000, 15_000, 45_000]

async function fetchRetrying5xx(url: string, init: RequestInit): Promise<Response> {
  for (const delay of RETRY_DELAYS_MS) {
    const res = await fetch(url, init)
    if (res.status < 500) return res
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  return fetch(url, init)
}

/** Error bodies can be a whole HTML error page (Render's 502 is ~100KB) -- keep the log/email readable. */
async function errorBody(res: Response): Promise<string> {
  return (await res.text()).slice(0, 300)
}

export function authHeaders(): Record<string, string> {
  const key = process.env.AGENT_API_KEY
  if (!key) {
    throw new Error('AGENT_API_KEY is not set -- run `npm run agent:setup` first and add it to .env')
  }
  return {
    Authorization: `users API-Key ${key}`,
    'Content-Type': 'application/json',
  }
}

export async function getLine(ref: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${PAYLOAD_URL}/api/lines/${ref}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`GET /api/lines/${ref} -> ${res.status}`)
  return (await res.json()) as Record<string, unknown>
}

/**
 * `draft` is load-bearing, not optional -- see the long comment in
 * syncLineGeometry.ts for why. In short: without `draft: true`, a PATCH
 * overwrites the live published document in place, no human review involved
 * (confirmed by testing). Only pass `draft: true` for an actual content
 * change; omit it for a trivial, non-editorial write (e.g. bumping a
 * lastUpdated timestamp with no content change) that doesn't need review.
 */
export async function patchLine(
  ref: string,
  body: Record<string, unknown>,
  opts: { draft?: boolean } = {},
): Promise<{ doc: Record<string, unknown> }> {
  const qs = opts.draft ? '?draft=true' : ''
  const res = await fetch(`${PAYLOAD_URL}/api/lines/${ref}${qs}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`PATCH /api/lines/${ref} -> ${res.status}: ${await res.text()}`)
  }
  return (await res.json()) as { doc: Record<string, unknown> }
}

export async function getStation(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${PAYLOAD_URL}/api/stations/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`GET /api/stations/${id} -> ${res.status}`)
  return (await res.json()) as Record<string, unknown>
}

/**
 * No `draft` option here, unlike patchLine -- every caller of this is the
 * timetable-sync job, which authenticates as the dedicated admin-role
 * sync account (see setupTimetableSyncUser.ts) specifically so its writes
 * publish directly. requireAdminToPublish only forces drafts back for a
 * non-admin identity, so this intentionally has no way to request draft
 * mode; if this function is ever reused by an agent-role job, that job
 * would need its own explicit `draft: true` the way patchLine does.
 */
export async function patchStation(id: string, body: Record<string, unknown>): Promise<{ doc: Record<string, unknown> }> {
  const res = await fetchRetrying5xx(`${PAYLOAD_URL}/api/stations/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`PATCH /api/stations/${id} -> ${res.status}: ${await errorBody(res)}`)
  }
  return (await res.json()) as { doc: Record<string, unknown> }
}

export type MovementEntryDoc = {
  id: string
  time: string
  trainNumber?: string
  platform?: string
}

export type PlkMatchedStation = {
  id: string
  plkStationId: number
  timetable: MovementEntryDoc[]
  arrivals: MovementEntryDoc[]
}

/** Every station with a plkStationId -- limit=0 asks Payload for the whole result set in one response. */
export async function listPlkMatchedStations(): Promise<PlkMatchedStation[]> {
  const url = `${PAYLOAD_URL}/api/stations?where[plkStationId][exists]=true&limit=0&depth=0`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
  const { docs } = (await res.json()) as { docs: PlkMatchedStation[] }
  return docs
}

export async function getTimetableInfo(): Promise<Record<string, unknown>> {
  const res = await fetch(`${PAYLOAD_URL}/api/globals/timetable-info`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`GET /api/globals/timetable-info -> ${res.status}`)
  return (await res.json()) as Record<string, unknown>
}

/**
 * POST, not PATCH -- Payload's REST API updates a global via POST /api/globals/:slug
 * (a global is a singleton, so there's no collection-item PATCH-vs-PUT distinction to
 * make). Confirmed the hard way: PATCH 404s ("Route not found") against a real running
 * instance before this fix.
 */
export async function patchTimetableInfo(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetchRetrying5xx(`${PAYLOAD_URL}/api/globals/timetable-info`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`POST /api/globals/timetable-info -> ${res.status}: ${await errorBody(res)}`)
  }
  return (await res.json()) as Record<string, unknown>
}

export type SourceEntry = {
  id?: string
  section: string
  label: string
  url?: string
  lastUpdated?: string
}

/** Bump `lastUpdated` on the one source entry for `section`, leaving every other entry (and its id) untouched. Creates the entry if none exists yet for that section. */
export function bumpSourceDate(sources: SourceEntry[], section: string, today: string): SourceEntry[] {
  const idx = sources.findIndex((s) => s.section === section)
  if (idx === -1) {
    return [...sources, { section, label: 'Weryfikacja agenta', lastUpdated: today }]
  }
  const updated = [...sources]
  updated[idx] = { ...updated[idx], lastUpdated: today }
  return updated
}
