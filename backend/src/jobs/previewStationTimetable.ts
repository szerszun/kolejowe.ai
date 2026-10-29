/**
 * Prints the official-style timetable for a few stations, built from PLK's live planned
 * schedule (src/timetable/stationTimetable.ts) -- for checking it against PLK's printed
 * station timetables before anything in the app uses it. Read-only: one PLK request,
 * nothing written anywhere.
 *
 * Usage: npm run timetable:preview -- [plkStationId ...]   (default: Wrocław Główny, Nysa, Jelenia Góra)
 */
import 'dotenv/config'
import { fetchSchedulesWithRoutes } from '../lib/plkApi'
import { formatRunningDays } from '../timetable/runningDays'
import { buildStationTimetable, timetablePeriodEnd, type TimetableRow } from '../timetable/stationTimetable'

const DEFAULT_STATIONS = [60103, 56606, 55806]

function line(row: TimetableRow): string {
  const train = [row.category, row.trainNumber].filter(Boolean).join(' ')
  const where = [row.platform && `peron ${row.platform}`, row.track && `tor ${row.track}`].filter(Boolean).join(', ')
  const via = row.via.length ? ` (przez ${row.via.join(', ')})` : ''
  return `  ${row.time}  ${train.padEnd(10)} ${(row.carrier ?? '').padEnd(3)} ${where.padEnd(18)} ${row.terminus}${via} -- ${formatRunningDays(row.runningDays, 'pl')}`
}

async function run() {
  const stationIds = process.argv.slice(2).map(Number).filter(Number.isFinite)
  const ids = stationIds.length ? stationIds : DEFAULT_STATIONS
  const today = new Date().toISOString().slice(0, 10)
  const window = { from: today, to: timetablePeriodEnd(today) }

  const { routes, stationNames } = await fetchSchedulesWithRoutes(ids, window.from, window.to)
  for (const id of ids) {
    const { departures, arrivals } = buildStationTimetable(routes, stationNames, id, window)
    console.log(`\n=== ${stationNames.get(id) ?? id} (PLK ${id}), ${window.from} to ${window.to}`)
    console.log(`\nODJAZDY (${departures.length})`)
    for (const row of departures) console.log(line(row))
    console.log(`\nPRZYJAZDY (${arrivals.length})`)
    for (const row of arrivals) console.log(line(row))
  }
}

run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
