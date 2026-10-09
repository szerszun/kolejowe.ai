/**
 * Minimal client for PKP PLK's Open Railway Data API (pdp-api.plk-sa.pl),
 * matching the fetch-only style of src/jobs/openaiClient.ts -- no SDK.
 *
 * Free "Basic" tier is capped at 100 req/hour, 1000/day, so callers should
 * cache responses rather than hitting this on every request.
 */
const PLK_BASE = 'https://pdp-api.plk-sa.pl'

function apiKey(): string {
  const key = process.env.PLK_API_KEY
  if (!key) {
    throw new Error('PLK_API_KEY is not set -- add it to backend/.env (register at https://pdp-api.plk-sa.pl)')
  }
  return key
}

async function plkFetch<T>(path: string, searchParams: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(path, PLK_BASE)
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  const res = await fetch(url, {
    headers: { 'X-API-Key': apiKey() },
  })
  if (!res.ok) {
    throw new Error(`PLK API ${url.pathname} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return (await res.json()) as T
}

export interface PlkStationDto {
  stationId: number
  name: string
  stationCodes: string[]
  city?: string
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

export type PlkStopType = 'start' | 'stop' | 'end' | string

export interface PlkStopDto {
  stationId: number
  sequenceNumber: number
  plannedArrivalTime?: string | null
  actualArrivalTime?: string | null
  plannedDepartureTime?: string | null
  actualDepartureTime?: string | null
  platform?: string | null
  stopType?: PlkStopType
}

export interface PlkTrainOperationDto {
  scheduleId: number
  orderId: number
  operatingDate: string
  stops: PlkStopDto[]
  trainNumber: string
  commercialTrainNumber?: string | null
  carrierCode: string
  status: string
}

export interface PlkStationDictionaryDto {
  name: string
  [key: string]: unknown
}

interface PlkOperationsResponse {
  generatedAt: string
  operations: PlkTrainOperationDto[]
  stations: Record<string, PlkStationDictionaryDto>
  services?: Record<string, unknown>
  carriers: Record<string, string>
}

/** Real-time operations (with planned times + delays) for one or more PLK station ids. */
export async function fetchOperationsForStations(stationIds: number[]): Promise<PlkOperationsResponse> {
  return plkFetch<PlkOperationsResponse>('/api/v1/operations', {
    stations: stationIds.join(','),
    withPlanned: true,
    fullRoutes: true,
  })
}
