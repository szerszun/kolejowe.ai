/**
 * Scheduled sync: checks PKP PLK's own schedulesVersion (GET /api/v1/data-version)
 * against the last-seen value in the timetable-info global, and -- only if it changed
 * -- updates existing timetable/arrivals entries' time and platform for every
 * PLK-matched station. Deliberately never creates or deletes an entry: PLK's schedule
 * data has no field mapping to this app's line numbers (confirmed against its own
 * Swagger spec), so a new entry can't be attributed to a line without guessing, and a
 * wrong guess means a wrong line badge shown to real users with no review catching it.
 * Unmatched trains on either side are reported, not acted on.
 *
 * Writes go out as the dedicated admin-role sync account (see
 * setupTimetableSyncUser.ts) via the REST helpers in payloadClient.ts, the same way
 * every other scheduled job authenticates -- no Local API, no filesystem access to the
 * Payload process, the same constraint a real external cron box would have. That
 * account is what makes the writes publish directly (no draft) without touching
 * requireAdminToPublish or the regular agent account every other job uses.
 */
import { fetchDataVersion, fetchSchedulesForStations, type PlkScheduleRoute } from '../lib/plkApi'
import {
  getTimetableInfo,
  listPlkMatchedStations,
  patchStation,
  patchTimetableInfo,
  type MovementEntryDoc,
} from './payloadClient'

// Keeps the ~340 PLK-matched stations in this dataset to a handful of batched calls
// (comma-separated `stations`, any-match) instead of one call per station -- see the
// long comment on fetchSchedulesForStations for why that matters against the 100
// req/hour quota. 50 is a conservative guess at a safe batch size, not a documented
// API limit; if PLK's response starts truncating or erroring at this size, lower it.
const STATION_BATCH_SIZE = 50

export interface EntryUpdate {
  stationId: string
  kind: 'departure' | 'arrival'
  trainNumber: string
  field: 'time' | 'platform'
  from: string | undefined
  to: string
}

export interface UnmatchedPlkTrain {
  stationPlkId: number
  trainNumber: string
  kind: 'departure' | 'arrival'
}

export interface UnmatchedEntry {
  stationId: string
  trainNumber: string
  kind: 'departure' | 'arrival'
}

export interface StationError {
  stationId: string
  message: string
}

export type SyncResult =
  | { outcome: 'unchanged' }
  | {
      outcome: 'synced'
      schedulesVersion: string
      stationsChecked: number
      updates: EntryUpdate[]
      unmatchedPlkTrains: UnmatchedPlkTrain[]
      unmatchedEntries: UnmatchedEntry[]
      errors: StationError[]
    }

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

interface PlkMovement {
  time: string
  platform?: string | null
}

/** routes -> per-station train-number -> movement, for both legs (a through train can depart and arrive at the same stop). */
function indexRoutesByStation(routes: PlkScheduleRoute[]): Map<number, { departures: Map<string, PlkMovement>; arrivals: Map<string, PlkMovement> }> {
  const byStation = new Map<number, { departures: Map<string, PlkMovement>; arrivals: Map<string, PlkMovement> }>()
  for (const route of routes) {
    for (const stop of route.stations) {
      let entry = byStation.get(stop.stationId)
      if (!entry) {
        entry = { departures: new Map(), arrivals: new Map() }
        byStation.set(stop.stationId, entry)
      }
      if (stop.departureTrainNumber && stop.departureTime) {
        entry.departures.set(stop.departureTrainNumber, { time: stop.departureTime.slice(0, 5), platform: stop.departurePlatform })
      }
      if (stop.arrivalTrainNumber && stop.arrivalTime) {
        entry.arrivals.set(stop.arrivalTrainNumber, { time: stop.arrivalTime.slice(0, 5) })
      }
    }
  }
  return byStation
}

/**
 * The hand-authored sample data writes a two-way service as e.g. "17206/7" (train
 * 17206 one direction, 17207 the other -- last digit(s) after the slash replace the
 * same number of digits at the end of the prefix). PLK's live API only ever returns
 * one directional number per movement, never the combined form. Confirmed the hard
 * way: an end-to-end run against the real API matched ~0 entries before this, because
 * exact-string matching never considered the split form. Returns [raw] unchanged if
 * there's no slash.
 */
export function trainNumberAliases(raw: string): string[] {
  const slash = raw.indexOf('/')
  if (slash === -1) return [raw]
  const prefix = raw.slice(0, slash)
  const suffix = raw.slice(slash + 1)
  if (suffix.length === 0 || suffix.length > prefix.length) return [prefix]
  return [prefix, prefix.slice(0, -suffix.length) + suffix]
}

function diffEntries(
  stationId: string,
  entries: MovementEntryDoc[],
  kind: 'departure' | 'arrival',
  plkByTrainNumber: Map<string, PlkMovement>,
): { updatedEntries: MovementEntryDoc[]; updates: EntryUpdate[]; unmatchedEntries: UnmatchedEntry[]; matchedTrainNumbers: Set<string> } {
  const updates: EntryUpdate[] = []
  const unmatchedEntries: UnmatchedEntry[] = []
  const matchedTrainNumbers = new Set<string>()

  const updatedEntries = entries.map((entry) => {
    if (!entry.trainNumber) return entry
    const matchedAlias = trainNumberAliases(entry.trainNumber).find((alias) => plkByTrainNumber.has(alias))
    const plk = matchedAlias ? plkByTrainNumber.get(matchedAlias) : undefined
    if (!plk) {
      unmatchedEntries.push({ stationId, trainNumber: entry.trainNumber, kind })
      return entry
    }
    matchedTrainNumbers.add(matchedAlias!)

    let updated = entry
    if (plk.time !== entry.time) {
      updates.push({ stationId, kind, trainNumber: entry.trainNumber, field: 'time', from: entry.time, to: plk.time })
      updated = { ...updated, time: plk.time }
    }
    if (kind === 'departure' && plk.platform && plk.platform !== entry.platform) {
      updates.push({ stationId, kind, trainNumber: entry.trainNumber, field: 'platform', from: entry.platform, to: plk.platform })
      updated = { ...updated, platform: plk.platform }
    }
    return updated
  })

  return { updatedEntries, updates, unmatchedEntries, matchedTrainNumbers }
}

export async function syncTimetables(): Promise<SyncResult> {
  const info = await getTimetableInfo()
  const lastVersion = typeof info.plkSchedulesVersion === 'string' ? info.plkSchedulesVersion : null

  const version = await fetchDataVersion()
  if (!version.schedulesVersion || version.schedulesVersion === lastVersion) {
    return { outcome: 'unchanged' }
  }

  const stations = await listPlkMatchedStations()
  const date = today()
  const batches = chunk(stations, STATION_BATCH_SIZE)

  const updates: EntryUpdate[] = []
  const unmatchedEntries: UnmatchedEntry[] = []
  const unmatchedPlkTrains: UnmatchedPlkTrain[] = []
  const errors: StationError[] = []

  // Each batch can take a while (a 50-station batch can return thousands of routes),
  // and this otherwise produces zero output until the whole run finishes -- confirmed
  // the hard way, running it end-to-end with no progress output made it indistinguishable
  // from a hang. One line per batch is enough to tell it's actually making progress.
  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`Batch ${batchIndex + 1}/${batches.length}: fetching schedules for ${batch.length} stations...`)
    let byStation: Map<number, { departures: Map<string, PlkMovement>; arrivals: Map<string, PlkMovement> }>
    try {
      const routes = await fetchSchedulesForStations(
        batch.map((s) => s.plkStationId),
        date,
      )
      byStation = indexRoutesByStation(routes)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      for (const station of batch) errors.push({ stationId: station.id, message })
      continue
    }

    for (const station of batch) {
      const plk = byStation.get(station.plkStationId) ?? { departures: new Map(), arrivals: new Map() }
      const dep = diffEntries(station.id, station.timetable ?? [], 'departure', plk.departures)
      const arr = diffEntries(station.id, station.arrivals ?? [], 'arrival', plk.arrivals)

      updates.push(...dep.updates, ...arr.updates)
      unmatchedEntries.push(...dep.unmatchedEntries, ...arr.unmatchedEntries)
      for (const trainNumber of plk.departures.keys()) {
        if (!dep.matchedTrainNumbers.has(trainNumber)) unmatchedPlkTrains.push({ stationPlkId: station.plkStationId, trainNumber, kind: 'departure' })
      }
      for (const trainNumber of plk.arrivals.keys()) {
        if (!arr.matchedTrainNumbers.has(trainNumber)) unmatchedPlkTrains.push({ stationPlkId: station.plkStationId, trainNumber, kind: 'arrival' })
      }

      if (dep.updates.length === 0 && arr.updates.length === 0) continue
      try {
        await patchStation(station.id, { timetable: dep.updatedEntries, arrivals: arr.updatedEntries })
      } catch (err) {
        errors.push({ stationId: station.id, message: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  await patchTimetableInfo({ plkSchedulesVersion: version.schedulesVersion })

  return {
    outcome: 'synced',
    schedulesVersion: version.schedulesVersion,
    stationsChecked: stations.length,
    updates,
    unmatchedPlkTrains,
    unmatchedEntries,
    errors,
  }
}
