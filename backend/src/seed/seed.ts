/**
 * One-time migration: load the frontend's static src/data/lines.ts +
 * src/data/stationDetails.ts and write it into Payload as already-published
 * documents. Run with `npm run seed` from backend/.
 *
 * Order matters because stations and lines reference each other:
 *   1. stations (base fields only -- no timetable/arrivals yet, since those
 *      reference line ids that don't exist in Payload until step 2)
 *   2. lines (reference station ids, which now exist)
 *   3. update the handful of stations that have real timetable/arrivals data
 *      (now that line ids exist to relate to)
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'
import { lines as frontendLines } from '../../../src/data/lines'
import { stationDetails } from '../../../src/data/stationDetails'
import type { Station } from '../../../src/types'
import { ensureUsers } from './ensureUsers'

async function run() {
  const payload = await getPayload({ config })

  // --- 1. collect every unique station referenced by any line ---
  const stationMap = new Map<string, Station>()
  for (const line of frontendLines) {
    for (const station of line.stations) {
      if (!stationMap.has(station.id)) stationMap.set(station.id, station)
    }
  }
  payload.logger.info(
    `Seeding ${stationMap.size} stations and ${frontendLines.length} lines from frontend data...`,
  )

  for (const station of stationMap.values()) {
    const details = stationDetails[station.id]

    await payload.create({
      collection: 'stations',
      data: {
        id: station.id,
        name: station.name,
        coordinates: station.coordinates,
        category: details?.category,
        address: details?.address,
        yearBuilt: details?.yearBuilt,
        platformCount: details?.platformCount,
        accessibility: details?.accessibility,
        amenities: (details?.amenities ?? []).map((label) => ({ label })),
        // Links directly to the source image rather than downloading and
        // re-uploading a local copy -- see the comment on Stations.photo.
        photo: details?.photo ? { url: details.photo.url, credit: details.photo.credit } : undefined,
        sources: details?.sources ?? [],
        _status: 'published',
      } as never,
      overrideAccess: true,
    })
  }
  payload.logger.info('Stations created.')

  // --- 2. lines, now that every station id they reference exists ---
  for (const line of frontendLines) {
    await payload.create({
      collection: 'lines',
      data: {
        id: line.id,
        number: line.number,
        name: line.name,
        status: line.status,
        electrified: line.electrified,
        lengthKm: line.lengthKm,
        tracks: line.tracks,
        maxSpeedKmh: line.maxSpeedKmh,
        manuallyCurated: line.manuallyCurated ?? false,
        operators: line.operators.map((value) => ({ value })),
        passengerServices: line.passengerServices.map((value) => ({ value })),
        endStations: line.endStations.map((value) => ({ value })),
        stations: line.stations.map((s) => s.id),
        geometry: line.geometry,
        history: {
          timeline: line.history.timeline,
          narrative: line.history.narrative,
        },
        tenders: line.tenders.map((t) => ({
          title: t.title,
          authority: t.authority,
          estimatedValuePLN: t.estimatedValuePLN,
          publicationDate: t.publicationDate,
          deadline: t.deadline,
          status: t.status,
          url: t.url,
          matchType: t.matchType,
        })),
        sources: line.sources,
        changeSummary: 'Initial seed from src/data/lines.ts.',
        _status: 'published',
      } as never,
      overrideAccess: true,
    })
  }
  payload.logger.info('Lines created.')

  // --- 3. backfill timetable/arrivals on the stations that have real data ---
  for (const [stationId, details] of Object.entries(stationDetails)) {
    await payload.update({
      collection: 'stations',
      id: stationId,
      data: {
        timetable: details.timetable.map((t) => ({
          time: t.time,
          lineId: t.lineId,
          operator: t.operator,
          platform: t.platform,
          daysOfOperation: t.daysOfOperation,
          destination: t.destination,
        })),
        arrivals: details.arrivals.map((a) => ({
          time: a.time,
          lineId: a.lineId,
          operator: a.operator,
          platform: a.platform,
          daysOfOperation: a.daysOfOperation,
          origin: a.origin,
        })),
        _status: 'published',
      } as never,
      overrideAccess: true,
    })
  }
  payload.logger.info('Station timetables backfilled.')

  // --- 4. admin + agent accounts, with stable credentials across re-seeds ---
  await ensureUsers(payload)
  payload.logger.info('Seed complete.')

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
