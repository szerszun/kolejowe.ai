/**
 * Turns PLK's raw per-station operation stops (src/lib/plkApi.ts) into the
 * small shape the frontend needs, with in-memory caching and quota
 * awareness -- the free API tier is capped at 100 req/hour, 1,000 req/day,
 * and many users could be looking at different stations at once.
 */
import {
  fetchOperationsForStations,
  getLastRateLimitStatus,
  PlkRateLimitError,
  type PlkOperationStationDto,
  type PlkTrainStatus,
} from './plkApi'

export interface LiveMovement {
  scheduledArrival: string | null
  scheduledDeparture: string | null
  actualArrival: string | null
  actualDeparture: string | null
  arrivalDelayMinutes: number | null
  departureDelayMinutes: number | null
  /** Whole train cancelled or partially cancelled (PLK trainStatus X/Q). */
  cancelled: boolean
}

// Deliberately doesn't compute an on-time/delayed verdict here: a train can
// run late into a station but recover the delay before departing (or vice
// versa), so arrival and departure need their own independent call --
// that's the caller's job once it knows whether it's rendering arrivals or
// departures (see applyLiveData in src/utils/departures.ts on the frontend).
function toLiveMovement(trainStatus: PlkTrainStatus | null, stop: PlkOperationStationDto): LiveMovement {
  return {
    scheduledArrival: stop.plannedArrival ?? null,
    scheduledDeparture: stop.plannedDeparture ?? null,
    actualArrival: stop.actualArrival ?? null,
    actualDeparture: stop.actualDeparture ?? null,
    arrivalDelayMinutes: stop.arrivalDelayMinutes ?? null,
    departureDelayMinutes: stop.departureDelayMinutes ?? null,
    cancelled: trainStatus === 'X' || trainStatus === 'Q',
  }
}

interface CacheEntry {
  expiresAt: number
  movements: LiveMovement[]
}

// Shared across requests within this server process -- fine for a single
// Render instance (the free tier runs exactly one).
const cache = new Map<number, CacheEntry>()
const CACHE_TTL_MS = 90_000

// Leave headroom below the real quota (see plkApi.ts: 100/hour, 1,000/day)
// for other consumers of the same key sharing this process, e.g. the
// matchPlkStations maintenance job.
const QUOTA_SAFETY_BUFFER = 5

/**
 * Pre-emptively treats the quota as exhausted using the real counts from
 * the API's own X-RateLimit-* response headers (see plkApi.ts), rather than
 * guessing from a self-tracked call count -- those headers are the only
 * authoritative source once another process (or an hour/day boundary)
 * could have changed things since this server started.
 */
function quotaLikelyExhausted(): boolean {
  const status = getLastRateLimitStatus()
  return (
    (status.hourlyRemaining !== null && status.hourlyRemaining <= QUOTA_SAFETY_BUFFER) ||
    (status.dailyRemaining !== null && status.dailyRemaining <= QUOTA_SAFETY_BUFFER)
  )
}

export type LiveMovementsUnavailableReason = 'rate_limited' | 'upstream_error'

export type LiveMovementsOutcome =
  | { ok: true; movements: LiveMovement[]; stale: boolean }
  | { ok: false; reason: LiveMovementsUnavailableReason }

/**
 * Fetches live movements for a station, falling back to a cached result
 * (marked `stale`) when the quota is exhausted or the upstream API fails,
 * and only reporting `ok: false` when there's no cache to fall back to --
 * that's the signal the frontend uses to show "dynamic data unavailable"
 * and drop back to timetable-only display (see useLiveMovements.ts).
 */
export async function getLiveMovements(plkStationId: number): Promise<LiveMovementsOutcome> {
  const cached = cache.get(plkStationId)
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, movements: cached.movements, stale: false }
  }

  if (quotaLikelyExhausted()) {
    if (cached) return { ok: true, movements: cached.movements, stale: true }
    return { ok: false, reason: 'rate_limited' }
  }

  try {
    const res = await fetchOperationsForStations([plkStationId])
    const movements = res.trains.flatMap((train) =>
      train.stations
        .filter((stop) => stop.stationId === plkStationId)
        .map((stop) => toLiveMovement(train.trainStatus, stop)),
    )
    cache.set(plkStationId, { expiresAt: Date.now() + CACHE_TTL_MS, movements })
    return { ok: true, movements, stale: false }
  } catch (err) {
    const reason: LiveMovementsUnavailableReason = err instanceof PlkRateLimitError ? 'rate_limited' : 'upstream_error'
    // Otherwise unavailable-by-design failures (quota, no match) never reach here, so
    // anything that does is worth a server log -- the frontend only ever sees "reason",
    // never this message, which is the only place the real cause survives.
    console.error(`[liveMovements] fetch failed for plkStationId=${plkStationId}:`, err)
    if (cached) return { ok: true, movements: cached.movements, stale: true }
    return { ok: false, reason }
  }
}
