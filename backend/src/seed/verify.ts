import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

async function run() {
  const payload = await getPayload({ config })

  const lines = await payload.find({ collection: 'lines', limit: 1000, depth: 0 })
  const stations = await payload.find({ collection: 'stations', limit: 1000, depth: 0 })

  console.log(`lines: ${lines.totalDocs}`)
  console.log(`stations: ${stations.totalDocs}`)

  const line277 = await payload.findByID({ collection: 'lines', id: '277', depth: 1 })
  console.log('\nline 277:', {
    name: line277.name,
    status: line277.status,
    _status: line277._status,
    lengthKm: line277.lengthKm,
    stationCount: Array.isArray(line277.stations) ? line277.stations.length : 0,
    firstStation:
      Array.isArray(line277.stations) && typeof line277.stations[0] === 'object'
        ? (line277.stations[0] as { name: string }).name
        : line277.stations?.[0],
    geometryPoints: Array.isArray(line277.geometry) ? line277.geometry.length : 0,
  })

  const wroclawGlowny = await payload.findByID({
    collection: 'stations',
    id: 'osm-155479759',
    depth: 1,
  })
  console.log('\nWrocław Główny station:', {
    name: wroclawGlowny.name,
    _status: wroclawGlowny._status,
    coordinates: wroclawGlowny.coordinates,
    timetableRows: wroclawGlowny.timetable?.length,
    arrivalRows: wroclawGlowny.arrivals?.length,
    photo: wroclawGlowny.photo,
  })

  const line282 = await payload.findByID({ collection: 'lines', id: '282', depth: 0 })
  console.log('\nline 282 tenders field present:', Array.isArray(line282.tenders))
  const line274 = await payload.findByID({ collection: 'lines', id: '274', depth: 0 })
  console.log('line 274 tenders:', line274.tenders)

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
