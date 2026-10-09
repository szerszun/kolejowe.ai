/**
 * One-off maintenance script: matches our Stations (OSM-sourced) to PKP
 * PLK's Open Data API station ids by normalized name, then writes
 * `plkStationId` onto each confident match.
 *
 * Uses the Local API with overrideAccess (same pattern as src/seed/seed.ts)
 * since this is metadata maintenance run interactively by a human, not a
 * recurring external agent job -- see src/jobs/syncLineGeometry.ts for why
 * *those* jobs go through the REST API instead.
 *
 * The station dictionary call is the only PLK API request this script
 * makes; it's cached to disk so re-running the matching logic while tuning
 * it doesn't burn against the 100/hour free-tier quota. Run with --fetch
 * once to populate the cache, then --apply (as many times as needed) to
 * compute matches and write them.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '../payload.config'
import { fetchAllPlkStations, type PlkStationDto } from '../lib/plkApi'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_PATH = path.resolve(dirname, '../data/plkStationsDictionary.json')

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function fetchAndCache() {
  console.log('Fetching full PLK station dictionary...')
  const stations = await fetchAllPlkStations()
  fs.writeFileSync(CACHE_PATH, JSON.stringify(stations, null, 2))
  console.log(`Cached ${stations.length} PLK stations -> ${CACHE_PATH}`)
}

async function applyMatches() {
  if (!fs.existsSync(CACHE_PATH)) {
    throw new Error(`No cached dictionary at ${CACHE_PATH} -- run with --fetch first.`)
  }
  const plkStations: PlkStationDto[] = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))

  const byNormalizedName = new Map<string, PlkStationDto[]>()
  for (const s of plkStations) {
    const key = normalize(s.name)
    const list = byNormalizedName.get(key) ?? []
    list.push(s)
    byNormalizedName.set(key, list)
  }

  const payload = await getPayload({ config })
  const { docs: ourStations } = await payload.find({
    collection: 'stations',
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  let matched = 0
  let ambiguous = 0
  let unmatched = 0
  const unmatchedNames: string[] = []
  const ambiguousNames: string[] = []

  for (const station of ourStations) {
    const key = normalize(station.name)
    const candidates = byNormalizedName.get(key)
    if (!candidates || candidates.length === 0) {
      unmatched++
      unmatchedNames.push(station.name)
      continue
    }
    if (candidates.length > 1) {
      ambiguous++
      ambiguousNames.push(`${station.name} (${candidates.map((c) => c.stationId).join(', ')})`)
      continue
    }
    await payload.update({
      collection: 'stations',
      id: station.id,
      data: { plkStationId: candidates[0].stationId },
      overrideAccess: true,
    })
    matched++
  }

  console.log(`Matched: ${matched}`)
  console.log(`Ambiguous (skipped, multiple PLK stations share this name): ${ambiguous}`)
  if (ambiguousNames.length) console.log('  ' + ambiguousNames.join('\n  '))
  console.log(`Unmatched (skipped, no PLK station with this exact normalized name): ${unmatched}`)
  if (unmatchedNames.length) console.log('  ' + unmatchedNames.join('\n  '))
}

async function main() {
  const mode = process.argv[2]
  if (mode === '--fetch') {
    await fetchAndCache()
  } else if (mode === '--apply') {
    await applyMatches()
  } else {
    console.error('Usage: tsx src/jobs/matchPlkStations.ts --fetch | --apply')
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FAILED:', err)
    process.exit(1)
  })
