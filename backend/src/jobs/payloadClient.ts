/**
 * Shared REST helpers for the scheduled agent jobs (geometry sync, overview
 * verify, history verify). Every job authenticates the same way a real
 * external cron box would have to -- the agent's own API key over REST, not
 * the trusted Local API -- so this lives in one place instead of being
 * copy-pasted per job.
 */
export const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000'

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
