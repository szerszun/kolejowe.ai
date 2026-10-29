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
  getStation,
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

// How many days of PLK's schedule each sync looks at, starting today. One day isn't
// enough: a train that doesn't run on the day the sync happens (weekend-only, selected
// days) would be reported as missing and never get its time updated. A week covers every
// weekday pattern; see pickMovement for how a train with different times on different
// days is resolved.
const SYNC_WINDOW_DAYS = 7

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
      /** Station writes that came back 5xx but were confirmed applied by reading the station back. */
      confirmedAfter5xx: number
      /**
       * False when any station errored: the PLK version is then deliberately not saved, so
       * the next run sees the same amendment again and retries. Stations that already
       * match are skipped by the diff, so a retry only rewrites what's still out of date.
       */
      versionSaved: boolean
      window: { from: string; to: string }
    }

function isoDate(daysFromToday: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + daysFromToday)
  return d.toISOString().slice(0, 10)
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

interface MovementVariant extends PlkMovement {
  /** Dates within the sync window this time/platform runs on, across every route that has it. */
  dates: Set<string>
}

/**
 * Over a multi-day window the same train number can show up in several routes with
 * different times (e.g. a weekday and a weekend variant). Keep the one that runs on the
 * most days in the window -- the regular timetable -- and break ties by the earliest
 * running date, so the result doesn't depend on the order PLK lists routes in.
 *
 * Days are counted per time/platform, not per route: PLK often splits one unchanged
 * timetable across several routes (e.g. 2 + 1 + 2 days). Counted per route, a variant
 * running 3 days in one piece beat one running 5 days in pieces, and which one won
 * flipped as the window moved a day -- seen live on 2026-10-29 at Nysa and Szklarska
 * Poręba Górna.
 */
function pickMovement(variants: Iterable<MovementVariant>): PlkMovement | undefined {
  let best: { variant: MovementVariant; days: number; firstDate: string } | undefined
  for (const variant of variants) {
    const days = variant.dates.size
    const firstDate = [...variant.dates].sort((a, b) => a.localeCompare(b))[0] ?? '9999-12-31'
    if (!best || days > best.days || (days === best.days && firstDate < best.firstDate)) best = { variant, days, firstDate }
  }
  return best && { time: best.variant.time, platform: best.variant.platform }
}

function windowDates(route: PlkScheduleRoute, from: string, to: string): string[] {
  return (route.operatingDates ?? []).map((d) => d.slice(0, 10)).filter((d) => d >= from && d <= to)
}

type VariantsByTrain = Map<string, Map<string, MovementVariant>>

function addVariant(byTrain: VariantsByTrain, trainNumber: string, movement: PlkMovement, dates: string[]): void {
  let variants = byTrain.get(trainNumber)
  if (!variants) {
    variants = new Map()
    byTrain.set(trainNumber, variants)
  }
  const key = `${movement.time}|${movement.platform ?? ''}`
  let variant = variants.get(key)
  if (!variant) {
    variant = { ...movement, dates: new Set() }
    variants.set(key, variant)
  }
  for (const d of dates) variant.dates.add(d)
}

function resolveVariants(byTrain: VariantsByTrain): Map<string, PlkMovement> {
  const resolved = new Map<string, PlkMovement>()
  for (const [trainNumber, variants] of byTrain) {
    const movement = pickMovement(variants.values())
    if (movement) resolved.set(trainNumber, movement)
  }
  return resolved
}

/** routes -> per-station train-number -> movement, for both legs (a through train can depart and arrive at the same stop). */
function indexRoutesByStation(
  routes: PlkScheduleRoute[],
  window: { from: string; to: string },
): Map<number, { departures: Map<string, PlkMovement>; arrivals: Map<string, PlkMovement> }> {
  const byStation = new Map<number, { departures: VariantsByTrain; arrivals: VariantsByTrain }>()
  for (const route of routes) {
    const dates = windowDates(route, window.from, window.to)
    for (const stop of route.stations) {
      let entry = byStation.get(stop.stationId)
      if (!entry) {
        entry = { departures: new Map(), arrivals: new Map() }
        byStation.set(stop.stationId, entry)
      }
      if (stop.departureTrainNumber && stop.departureTime) {
        addVariant(entry.departures, stop.departureTrainNumber, { time: stop.departureTime.slice(0, 5), platform: stop.departurePlatform }, dates)
      }
      if (stop.arrivalTrainNumber && stop.arrivalTime) {
        addVariant(entry.arrivals, stop.arrivalTrainNumber, { time: stop.arrivalTime.slice(0, 5) }, dates)
      }
    }
  }
  const resolved = new Map<number, { departures: Map<string, PlkMovement>; arrivals: Map<string, PlkMovement> }>()
  for (const [stationId, entry] of byStation) {
    resolved.set(stationId, { departures: resolveVariants(entry.departures), arrivals: resolveVariants(entry.arrivals) })
  }
  return resolved
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

function is5xx(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status
  return typeof status === 'number' && status >= 500
}

function sameEntries(actual: unknown, expected: MovementEntryDoc[]): boolean {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false
  return expected.every((e, i) => {
    const a = actual[i] as Partial<MovementEntryDoc> | undefined
    return a?.trainNumber === e.trainNumber && a?.time === e.time && (a?.platform ?? undefined) === (e.platform ?? undefined)
  })
}

/**
 * A station write that times out at Render's proxy (502/504) usually still completes on
 * the backend -- confirmed on a real run, where a station reported as a 502 error already
 * had the new times. Read it back before counting it as a failure.
 */
async function writeLandedDespite5xx(stationId: string, timetable: MovementEntryDoc[], arrivals: MovementEntryDoc[]): Promise<boolean> {
  try {
    const doc = await getStation(stationId)
    return sameEntries(doc.timetable, timetable) && sameEntries(doc.arrivals, arrivals)
  } catch {
    return false
  }
}

export async function syncTimetables(): Promise<SyncResult> {
  const info = await getTimetableInfo()
  const lastVersion = typeof info.plkSchedulesVersion === 'string' ? info.plkSchedulesVersion : null

  const version = await fetchDataVersion()
  if (!version.schedulesVersion || version.schedulesVersion === lastVersion) {
    return { outcome: 'unchanged' }
  }

  const stations = await listPlkMatchedStations()
  const window = { from: isoDate(0), to: isoDate(SYNC_WINDOW_DAYS - 1) }
  const batches = chunk(stations, STATION_BATCH_SIZE)

  const updates: EntryUpdate[] = []
  const unmatchedEntries: UnmatchedEntry[] = []
  const unmatchedPlkTrains: UnmatchedPlkTrain[] = []
  const errors: StationError[] = []
  let confirmedAfter5xx = 0

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
        window.from,
        window.to,
      )
      byStation = indexRoutesByStation(routes, window)
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
        if (is5xx(err) && (await writeLandedDespite5xx(station.id, dep.updatedEntries, arr.updatedEntries))) {
          confirmedAfter5xx++
          continue
        }
        errors.push({ stationId: station.id, message: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  const versionSaved = errors.length === 0
  if (versionSaved) await patchTimetableInfo({ plkSchedulesVersion: version.schedulesVersion })

  return {
    outcome: 'synced',
    schedulesVersion: version.schedulesVersion,
    stationsChecked: stations.length,
    updates,
    unmatchedPlkTrains,
    unmatchedEntries,
    errors,
    confirmedAfter5xx,
    versionSaved,
    window,
  }
}
