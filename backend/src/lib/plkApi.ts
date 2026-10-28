/**
 * Minimal client for PKP PLK's Open Railway Data API (pdp-api.plk-sa.pl),
 * matching the fetch-only style of src/jobs/openaiClient.ts -- no SDK.
 *
 * Free "Basic" tier is capped at 100 req/hour, 1,000 req/day (confirmed from
 * the API's own swagger doc and the X-RateLimit-* response headers below --
 * NOT the 1,000/hour, 8,000/day the project owner initially recalled).
 * Callers should cache responses rather than hitting this on every request.
 */
const PLK_BASE = 'https://pdp-api.plk-sa.pl'

function apiKey(): string {
  const key = process.env.PLK_API_KEY
  if (!key) {
    throw new Error('PLK_API_KEY is not set -- add it to backend/.env (register at https://pdp-api.plk-sa.pl)')
  }
  return key
}

export class PlkRateLimitError extends Error {}

/** Anything that isn't a 429: network failure, 4xx, 5xx -- i.e. "the API isn't working right now". */
export class PlkApiError extends Error {}

export interface PlkRateLimitStatus {
  hourlyLimit: number | null
  hourlyRemaining: number | null
  dailyLimit: number | null
  dailyRemaining: number | null
}

let lastRateLimitStatus: PlkRateLimitStatus = {
  hourlyLimit: null,
  hourlyRemaining: null,
  dailyLimit: null,
  dailyRemaining: null,
}

/** Quota state as of the most recent response -- null fields mean "no request has completed yet this process". */
export function getLastRateLimitStatus(): PlkRateLimitStatus {
  return lastRateLimitStatus
}

function toIntOrNull(value: string | null): number | null {
  if (value == null) return null
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

async function plkFetch<T>(path: string, searchParams: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(path, PLK_BASE)
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  let res: Response
  try {
    res = await fetch(url, { headers: { 'X-API-Key': apiKey() } })
  } catch (err) {
    throw new PlkApiError(`Could not reach PLK API at ${url.pathname}: ${err instanceof Error ? err.message : String(err)}`)
  }

  // The API reports live quota state on every response, including 429s --
  // capture it regardless of status so callers can make pre-emptive
  // decisions (see getLastRateLimitStatus / src/lib/liveMovements.ts).
  lastRateLimitStatus = {
    hourlyLimit: toIntOrNull(res.headers.get('X-RateLimit-Hourly-Limit')),
    hourlyRemaining: toIntOrNull(res.headers.get('X-RateLimit-Hourly-Remaining')),
    dailyLimit: toIntOrNull(res.headers.get('X-RateLimit-Daily-Limit')),
    dailyRemaining: toIntOrNull(res.headers.get('X-RateLimit-Daily-Remaining')),
  }

  if (res.status === 429) {
    throw new PlkRateLimitError(`PLK API ${url.pathname} -> HTTP 429: ${(await res.text()).slice(0, 300)}`)
  }
  if (!res.ok) {
    throw new PlkApiError(`PLK API ${url.pathname} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return (await res.json()) as T
}

export interface PlkStationDto {
  id: number
  name: string
}

interface PlkStationsResponse {
  generatedAt: string
  stations: PlkStationDto[]
}

/** Fetches the full station dictionary, paginating until exhausted. */
export async function fetchAllPlkStations(): Promise<PlkStationDto[]> {
  const all: PlkStationDto[] = []
  let page = 1
  const pageSize = 10000
  for (;;) {
    const res = await plkFetch<PlkStationsResponse>('/api/v1/dictionaries/stations', { page, pageSize })
    all.push(...res.stations)
    if (res.stations.length < pageSize) break
    page++
  }
  return all
}

/** Train status codes per the API: S=NotStarted, P=InProgress, C=Completed, X=Cancelled, Q=PartialCancelled. */
export type PlkTrainStatus = 'S' | 'P' | 'C' | 'X' | 'Q' | string

export interface PlkOperationStationDto {
  stationId: number
  plannedSequenceNumber?: number | null
  actualSequenceNumber?: number | null
  /** ISO date-time, UTC-naive (OperatingDate + planned time). Omitted unless withPlanned=true. */
  plannedArrival?: string | null
  plannedDeparture?: string | null
  actualArrival?: string | null
  actualDeparture?: string | null
  arrivalDelayMinutes?: number | null
  departureDelayMinutes?: number | null
  isConfirmed?: boolean
}

export interface PlkTrainOperationDto {
  scheduleId: number
  orderId: number
  trainOrderId: number
  operatingDate: string
  trainStatus: PlkTrainStatus | null
  /**
   * Stops along the route. With `fullRoutes: false` (the default, and what
   * this client always sends) this is NOT the full route -- the API narrows
   * it to just the stop(s) matching the `stations` filter, which is exactly
   * what the caller wants, so there's no need to search for "our" station
   * within the array.
   */
  stations: PlkOperationStationDto[]
}

interface PlkOperationsResponse {
  generatedAt: string
  trains: PlkTrainOperationDto[]
  /** Station dictionary (id -> name), only for ids referenced by `trains`. */
  stations: Record<string, string>
}

/**
 * Real-time operations (with planned times + delays) for one or more PLK
 * station ids, today. `withPlanned: true` is required to get planned
 * times and delay minutes back at all -- without it the response only has
 * actual times. Deliberately never passes `fullRoutes: true`: that returns
 * every stop of every matched train nationwide, far beyond what's needed
 * here and far more expensive against the 100 req/hour quota.
 */
export async function fetchOperationsForStations(stationIds: number[]): Promise<PlkOperationsResponse> {
  return plkFetch<PlkOperationsResponse>('/api/v1/operations', {
    stations: stationIds.join(','),
    withPlanned: true,
  })
}

export interface PlkDataVersion {
  dataVersion: string | null
  /** Changes specifically when the *planned* timetable changes -- the signal sync-timetables.ts polls for. */
  schedulesVersion: string | null
  operationsVersion: string | null
  timestamp: string
}

/** Cheap poll target: one small response, no quota-relevant payload, to check whether a full schedule re-fetch is worth doing at all. */
export async function fetchDataVersion(): Promise<PlkDataVersion> {
  return plkFetch<PlkDataVersion>('/api/v1/data-version', {})
}

export interface PlkScheduleStop {
  stationId: number
  orderNumber: number
  arrivalTime?: string | null
  departureTime?: string | null
  departurePlatform?: string | null
  departureTrainNumber?: string | null
  arrivalTrainNumber?: string | null
}

export interface PlkScheduleRoute {
  scheduleId: number
  orderId: number
  trainOrderId: number
  name?: string | null
  carrierCode?: string | null
  operatingDates: string[]
  stations: PlkScheduleStop[]
}

interface PlkSchedulesResponse {
  generatedAt: string
  period: { from: string; to: string }
  routes: PlkScheduleRoute[]
}

/**
 * The planned (not real-time) schedule for a batch of stations over a date range -- what
 * sync-timetables.ts diffs against the published data. Batched (comma-separated
 * `stations`, any-match) rather than one call per station deliberately: with ~340
 * PLK-matched stations in this project's dataset and only a 100 req/hour quota,
 * per-station calls would blow the budget in well under an hour. Confirmed live that
 * a 3-station batch returns all three stations' routes in one response before relying
 * on it; the caller (syncTimetables.ts) is responsible for chunking the full station
 * list to a safe batch size.
 */
export async function fetchSchedulesForStations(stationIds: number[], dateFrom: string, dateTo: string): Promise<PlkScheduleRoute[]> {
  const res = await plkFetch<PlkSchedulesResponse>('/api/v1/schedules', {
    stations: stationIds.join(','),
    dateFrom,
    dateTo,
  })
  return res.routes
}
