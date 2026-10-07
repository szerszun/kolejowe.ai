/**
 * Minimal TS port of this project's Overpass fetch + duplicate-track
 * dedup + stitch pipeline (originally prototyped in Python during the
 * line-geometry cleanup pass earlier in this project's history -- ported
 * here so the scheduled agent job doesn't depend on a second language
 * runtime or on scripts that only ever lived in an ephemeral scratchpad).
 *
 * Deliberately a *subset* of what was needed for the original one-off
 * fixes (no region-border clipping, no manual per-line trims) -- this is
 * meant for drift *detection* against an already-correct published
 * geometry, not for building a line's geometry from scratch. A line whose
 * real alignment sits right at the region border (273/275/277/282/271)
 * will look "drifted" here even with no real change, because the
 * published geometry is clipped and this fetch isn't -- skip those when
 * choosing what to sync automatically, or extend this with the same
 * region-polygon clip described in the repo's README if you need it.
 */

export type LonLat = [number, number]

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const USER_AGENT = 'kolejowe-ai-agent/0.1 (scheduled drift-check; one-off project)'
const BBOX = '49.0,14.0,52.5,19.0' // generous box covering Dolnoslaskie + neighbours

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function overpassQuery(
  query: string,
  tries = 6,
  baseDelayMs = 8000,
  timeoutMs = 60_000,
): Promise<unknown> {
  let lastErr: unknown
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      // Unlike a rejected/erroring request, a connection the server just
      // never responds on would hang forever without this -- fetch() has
      // no default timeout, so a single stuck attempt would silently
      // block every retry behind it.
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      // Overpass occasionally returns a 200 with a degraded body under load
      // (e.g. {"remark": "..."} instead of {"elements": [...]}) -- that
      // passes the HTTP check above but every call site here assumes
      // `.elements` exists, so treat a missing one as retryable too instead
      // of letting it crash downstream as "object is not iterable".
      if (!body || typeof body !== 'object' || !Array.isArray((body as { elements?: unknown }).elements)) {
        throw new Error(`Overpass response missing "elements": ${JSON.stringify(body).slice(0, 200)}`)
      }
      return body
    } catch (err) {
      lastErr = err
      await sleep(Math.min(baseDelayMs * (attempt + 1), 60_000))
    }
  }
  throw new Error(`Overpass query failed after ${tries} tries: ${String(lastErr)}`)
}

export function haversineKm(a: LonLat, b: LonLat): number {
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const r = 6371
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lon2 - lon1) * Math.PI) / 180
  const h = Math.sin(dPhi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLambda / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(h))
}

export function segLength(coords: LonLat[]): number {
  let total = 0
  for (let i = 0; i < coords.length - 1; i++) total += haversineKm(coords[i], coords[i + 1])
  return total
}

type WaySegment = { id: number; coords: LonLat[] }

type OverpassElement = {
  id: number
  type: string
  tags?: Record<string, string>
  members?: { type: string; ref: number; role: string }[]
  geometry?: { lon: number; lat: number }[]
}

/** Fetch a route relation's raw way segments by PKP ref number. Returns null if no active relation exists. */
export async function fetchRouteWays(
  ref: string,
): Promise<{ relationId: number; tags: Record<string, string>; segments: WaySegment[] } | null> {
  const relQuery = `[out:json][timeout:45];relation["route"="railway"]["ref"="${ref}"](${BBOX});out tags;`
  const relData = (await overpassQuery(relQuery)) as { elements: OverpassElement[] }
  if (!relData.elements?.length) return null
  const rel = relData.elements[0]
  const relationId = rel.id
  const tags = rel.tags ?? {}

  await sleep(3000)
  const membersQuery = `[out:json][timeout:45];relation(${relationId});out body;`
  const membersData = (await overpassQuery(membersQuery)) as { elements: OverpassElement[] }
  const members = membersData.elements[0]?.members ?? []
  const wayIds = members.filter((m) => m.type === 'way').map((m) => m.ref)

  const waysById = new Map<number, LonLat[]>()
  await sleep(3000)
  const chunkSize = 20
  for (let i = 0; i < wayIds.length; i += chunkSize) {
    const chunk = wayIds.slice(i, i + chunkSize).join(',')
    const wayData = (await overpassQuery(
      `[out:json][timeout:30];way(id:${chunk});out geom;`,
    )) as { elements: OverpassElement[] }
    for (const w of wayData.elements) {
      const coords: LonLat[] = (w.geometry ?? []).filter(Boolean).map((g) => [g.lon, g.lat])
      if (coords.length >= 2) waysById.set(w.id, coords)
    }
    await sleep(3000)
  }

  const segments: WaySegment[] = []
  for (const wayId of wayIds) {
    const coords = waysById.get(wayId)
    if (coords) segments.push({ id: wayId, coords })
  }
  return { relationId, tags, segments }
}

// --- duplicate-parallel-track detection (pairwise, same heuristic as the
//     Python prototype: similar length + most points of one within
//     thresh_km of the other) ---

function fracClose(a: LonLat[], b: LonLat[], threshKm: number): number {
  if (a.length === 0) return 0
  let close = 0
  for (const p of a) {
    let best = Infinity
    for (const q of b) {
      const d = haversineKm(p, q)
      if (d < best) best = d
    }
    if (best <= threshKm) close++
  }
  return close / a.length
}

export function findDuplicatePairs(
  segs: WaySegment[],
  threshKm = 0.08,
  fracThresh = 0.85,
): Set<string> {
  const dup = new Set<string>()
  for (let i = 0; i < segs.length; i++) {
    const li = segLength(segs[i].coords)
    for (let j = i + 1; j < segs.length; j++) {
      const lj = segLength(segs[j].coords)
      if (li === 0 || lj === 0) continue
      const ratio = Math.min(li, lj) / Math.max(li, lj)
      if (ratio < 0.5) continue
      const f1 = fracClose(segs[i].coords, segs[j].coords, threshKm)
      const f2 = fracClose(segs[j].coords, segs[i].coords, threshKm)
      if (Math.max(f1, f2) >= fracThresh) dup.add(`${i}:${j}`)
    }
  }
  return dup
}

export function clusterAndDedupe(
  segs: WaySegment[],
  dupPairs: Set<string>,
): { kept: number[]; dropped: number[] } {
  const parent = segs.map((_, i) => i)
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  const union = (x: number, y: number) => {
    const rx = find(x)
    const ry = find(y)
    if (rx !== ry) parent[ry] = rx
  }
  for (const pair of dupPairs) {
    const [i, j] = pair.split(':').map(Number)
    union(i, j)
  }
  const groups = new Map<number, number[]>()
  for (let i = 0; i < segs.length; i++) {
    const r = find(i)
    if (!groups.has(r)) groups.set(r, [])
    groups.get(r)!.push(i)
  }
  const kept: number[] = []
  const dropped: number[] = []
  for (const members of groups.values()) {
    let best = members[0]
    let bestLen = segLength(segs[best].coords)
    for (const m of members) {
      const len = segLength(segs[m].coords)
      if (len > bestLen) {
        best = m
        bestLen = len
      }
    }
    kept.push(best)
    for (const m of members) if (m !== best) dropped.push(m)
  }
  return { kept: kept.sort((a, b) => a - b), dropped: dropped.sort((a, b) => a - b) }
}

function greedyStitch(
  coordsList: LonLat[][],
  startIdx: number,
  startEnd: 'start' | 'end',
  maxGapKm = 1.6,
): { chain: LonLat[]; used: number[]; jumpKm: number } {
  const remaining = coordsList.map((_, i) => i).filter((i) => i !== startIdx)
  let chain = [...coordsList[startIdx]]
  if (startEnd === 'start') chain = [...chain].reverse()
  const used = [startIdx]
  let totalJump = 0

  while (remaining.length > 0) {
    const last = chain[chain.length - 1]
    let bestI = -1
    let bestEnd: 'start' | 'end' = 'start'
    let bestD = Infinity
    for (const i of remaining) {
      const seg = coordsList[i]
      const d0 = haversineKm(last, seg[0])
      const d1 = haversineKm(last, seg[seg.length - 1])
      if (d0 < bestD) {
        bestD = d0
        bestI = i
        bestEnd = 'start'
      }
      if (d1 < bestD) {
        bestD = d1
        bestI = i
        bestEnd = 'end'
      }
    }
    if (bestI === -1 || bestD > maxGapKm) break
    totalJump += bestD
    let seg = coordsList[bestI]
    if (bestEnd === 'end') seg = [...seg].reverse()
    chain = chain.concat(seg)
    used.push(bestI)
    remaining.splice(remaining.indexOf(bestI), 1)
  }
  return { chain, used, jumpKm: totalJump }
}

export type BuiltLine = {
  chain: LonLat[]
  lengthKm: number
  segsTotal: number
  segsKeptAfterDedupe: number
  segsDroppedAsDup: number
  segsUsedInChain: number
  segsUnused: number
  totalJumpKm: number
}

export function buildLine(segs: WaySegment[], threshKm = 0.08, fracThresh = 0.85): BuiltLine {
  const dup = findDuplicatePairs(segs, threshKm, fracThresh)
  const { kept, dropped } = clusterAndDedupe(segs, dup)
  const keptSegs = kept.map((i) => segs[i])
  const coordsList = keptSegs.map((s) => s.coords)

  let best: { chain: LonLat[]; used: number[]; jumpKm: number } | null = null
  for (let startIdx = 0; startIdx < coordsList.length; startIdx++) {
    for (const startEnd of ['start', 'end'] as const) {
      const candidate = greedyStitch(coordsList, startIdx, startEnd)
      const better =
        !best ||
        candidate.used.length > best.used.length ||
        (candidate.used.length === best.used.length && candidate.jumpKm < best.jumpKm)
      if (better) best = candidate
    }
  }
  if (!best) throw new Error('buildLine: no segments to stitch')

  return {
    chain: best.chain,
    lengthKm: Math.round(segLength(best.chain) * 100) / 100,
    segsTotal: segs.length,
    segsKeptAfterDedupe: keptSegs.length,
    segsDroppedAsDup: dropped.length,
    segsUsedInChain: best.used.length,
    segsUnused: coordsList.length - best.used.length,
    totalJumpKm: Math.round(best.jumpKm * 1000) / 1000,
  }
}
