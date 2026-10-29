/**
 * Builds one station's timetable -- departures and arrivals -- from PLK's planned routes,
 * the way PLK's printed station timetables list it: one row per train variant (time,
 * train, platform/track, destination), each with a note on which days it runs.
 *
 * A train with different times or platforms on different days is several rows, not one
 * "most common" time: the timetable has to be right for every date, and delays or
 * cancellations are left to the live feed.
 */
import type { PlkScheduleRoute, PlkScheduleStop } from '../lib/plkApi'
import { describeRunningDays, type RunningDays } from './runningDays'

export interface TimetableRow {
  time: string
  category: string | null
  trainNumber: string
  carrier: string | null
  platform: string | null
  track: string | null
  /** Destination for a departure, origin for an arrival. */
  terminus: string
  /** Calling points between this station and the terminus, in travel order. */
  via: string[]
  runningDays: RunningDays
}

export interface StationTimetable {
  departures: TimetableRow[]
  arrivals: TimetableRow[]
}

/** Calling points kept per row. Printed timetables pick a few major stations; until we know which stations those are, an even spread along the route. */
const MAX_VIA = 3

function pickVia(names: string[]): string[] {
  if (names.length <= MAX_VIA) return names
  return Array.from({ length: MAX_VIA }, (_, i) => names[Math.round(((i + 1) * (names.length + 1)) / (MAX_VIA + 1)) - 1])
}

interface Variant extends Omit<TimetableRow, 'runningDays'> {
  dates: Set<string>
}

export function buildStationTimetable(
  routes: PlkScheduleRoute[],
  stationNames: Map<number, string>,
  plkStationId: number,
  window: { from: string; to: string },
): StationTimetable {
  const name = (stop: PlkScheduleStop) => stationNames.get(stop.stationId) ?? `#${stop.stationId}`
  const departures = new Map<string, Variant>()
  const arrivals = new Map<string, Variant>()

  const add = (into: Map<string, Variant>, row: Omit<Variant, 'dates'>, dates: string[]) => {
    const key = [row.time, row.category, row.trainNumber, row.platform, row.track, row.terminus, row.via.join('>')].join('|')
    let variant = into.get(key)
    if (!variant) {
      variant = { ...row, dates: new Set() }
      into.set(key, variant)
    }
    for (const d of dates) variant.dates.add(d)
  }

  for (const route of routes) {
    const stops = [...route.stations].sort((a, b) => a.orderNumber - b.orderNumber)
    const at = stops.findIndex((s) => s.stationId === plkStationId)
    if (at === -1) continue
    const stop = stops[at]
    const dates = route.operatingDates.map((d) => d.slice(0, 10))

    if (stop.departureTime && at < stops.length - 1) {
      add(
        departures,
        {
          time: stop.departureTime.slice(0, 5),
          category: stop.departureCommercialCategory ?? route.commercialCategorySymbol ?? null,
          trainNumber: stop.departureTrainNumber ?? route.nationalNumber ?? '',
          carrier: route.carrierCode ?? null,
          platform: stop.departurePlatform ?? null,
          track: stop.departureTrack ?? null,
          terminus: name(stops[stops.length - 1]),
          via: pickVia(stops.slice(at + 1, -1).map(name)),
        },
        dates,
      )
    }
    if (stop.arrivalTime && at > 0) {
      add(
        arrivals,
        {
          time: stop.arrivalTime.slice(0, 5),
          category: stop.arrivalCommercialCategory ?? route.commercialCategorySymbol ?? null,
          trainNumber: stop.arrivalTrainNumber ?? route.nationalNumber ?? '',
          carrier: route.carrierCode ?? null,
          platform: stop.arrivalPlatform ?? null,
          track: stop.arrivalTrack ?? null,
          terminus: name(stops[0]),
          via: pickVia(stops.slice(1, at).map(name)),
        },
        dates,
      )
    }
  }

  // By time, then train; variants of the same train in the order they start running.
  const finish = (variants: Map<string, Variant>): TimetableRow[] =>
    [...variants.values()]
      .flatMap(({ dates, ...row }) => {
        const runningDays = describeRunningDays(dates, window)
        const firstDate = [...dates].filter((d) => d >= window.from).sort((a, b) => a.localeCompare(b))[0]
        return runningDays ? [{ row: { ...row, runningDays }, firstDate }] : []
      })
      .sort((a, b) => a.row.time.localeCompare(b.row.time) || a.row.trainNumber.localeCompare(b.row.trainNumber) || a.firstDate.localeCompare(b.firstDate))
      .map(({ row }) => row)

  return { departures: finish(departures), arrivals: finish(arrivals) }
}

/** Last day of the annual timetable period that contains `date`: PLK switches timetables on the night before the second Sunday of December. */
export function timetablePeriodEnd(date: string): string {
  const year = Number(date.slice(0, 4))
  const secondSundayOfDecember = (y: number) => {
    const d = new Date(Date.UTC(y, 11, 1))
    const firstSunday = 1 + ((7 - d.getUTCDay()) % 7)
    return new Date(Date.UTC(y, 11, firstSunday + 7))
  }
  let switchDay = secondSundayOfDecember(year)
  if (new Date(`${date}T00:00:00Z`) >= switchDay) switchDay = secondSundayOfDecember(year + 1)
  switchDay.setUTCDate(switchDay.getUTCDate() - 1)
  return switchDay.toISOString().slice(0, 10)
}
