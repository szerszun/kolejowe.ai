/**
 * Re-fetch one line's geometry from OpenStreetMap/Overpass, compare it to
 * what's currently published in Payload, and -- if it looks different --
 * write a draft update explaining the diff. Always goes through the REST
 * API with the agent's API key, the same way a real external scheduled
 * job (GitHub Action, cron box, whatever) would have to: no Local API,
 * no filesystem access to the Payload process.
 */
import { buildLine, fetchRouteWays, type LonLat } from './overpass'
import { getLine, patchLine } from './payloadClient'

type LineDoc = {
  id: string
  name: string
  lengthKm: number
  geometry: LonLat[]
  _status: string
}

async function getPublishedLine(ref: string): Promise<LineDoc> {
  return (await getLine(ref)) as unknown as LineDoc
}

function roundCoord([lon, lat]: LonLat): LonLat {
  return [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5]
}

function geometriesEqual(a: LonLat[], b: LonLat[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const [alon, alat] = roundCoord(a[i])
    const [blon, blat] = roundCoord(b[i])
    if (alon !== blon || alat !== blat) return false
  }
  return true
}

export type SyncResult =
  | { ref: string; outcome: 'no_published_line' }
  | { ref: string; outcome: 'no_active_relation' }
  | { ref: string; outcome: 'unchanged'; lengthKm: number }
  | {
      ref: string
      outcome: 'drift_written_as_draft'
      oldLengthKm: number
      newLengthKm: number
      oldPoints: number
      newPoints: number
      stillDraftAfterWrite: boolean
    }

export async function syncLineGeometry(ref: string): Promise<SyncResult> {
  let current: LineDoc
  try {
    current = await getPublishedLine(ref)
  } catch {
    return { ref, outcome: 'no_published_line' }
  }

  const fetched = await fetchRouteWays(ref)
  if (!fetched || fetched.segments.length === 0) {
    return { ref, outcome: 'no_active_relation' }
  }

  const built = buildLine(fetched.segments)
  const roundedChain = built.chain.map(roundCoord)

  if (geometriesEqual(roundedChain, current.geometry)) {
    return { ref, outcome: 'unchanged', lengthKm: built.lengthKm }
  }

  const changeSummary = [
    `Agent re-fetch from Overpass (route relation ${fetched.relationId}) found a different geometry than what's published.`,
    `Length: ${current.lengthKm}km -> ${built.lengthKm}km. Points: ${current.geometry.length} -> ${roundedChain.length}.`,
    `Pipeline stats: ${built.segsTotal} raw way segments, ${built.segsDroppedAsDup} dropped as duplicate-track, ${built.segsUnused} left unstitched (gap > 1.6km), total stitch jump ${built.totalJumpKm}km.`,
    'Not auto-published -- a human needs to sanity-check this (NOT region-clipped the way the original build was, so a line that legitimately crosses the Dolnoslaskie border, like 271/273/275/277/282, will always show as "changed" here even with no real update; see src/jobs/overpass.ts).',
  ].join(' ')

  // `draft=true` is load-bearing, not optional: without it, PATCH updates the
  // live document row in place, immediately replacing the published content
  // (confirmed by testing against a deliberately mutated line). With it,
  // Payload writes a *new* version and leaves the published row untouched
  // until an admin approves it.
  //
  // Deliberately NOT sending `_status: 'published'` here, even though the
  // agent "morally" doesn't have publish rights anyway and
  // requireAdminToPublish would force it back to draft regardless: sending
  // draft=true (a request to save a draft) and _status: 'published' (a
  // request to publish) together is a contradictory pair of signals that, in
  // testing, corrupted which version a plain unauthenticated GET resolves
  // to afterward -- it kept resolving to the new draft instead of the still-
  // current published one. Just asking for a draft plainly avoids the
  // conflict; requireAdminToPublish stays in place as a backstop for the
  // case where draft=true is omitted entirely.
  const patched = (await patchLine(
    ref,
    { geometry: roundedChain, lengthKm: built.lengthKm, changeSummary },
    { draft: true },
  )) as unknown as { doc: LineDoc }

  return {
    ref,
    outcome: 'drift_written_as_draft',
    oldLengthKm: current.lengthKm,
    newLengthKm: built.lengthKm,
    oldPoints: current.geometry.length,
    newPoints: roundedChain.length,
    stillDraftAfterWrite: patched.doc._status === 'draft',
  }
}
