/**
 * Cheap, fast check only -- calls GET /api/v1/data-version and compares against the
 * last-seen value, writing a `changed` GitHub Actions output. Deliberately a separate
 * script from runSyncTimetables.ts: the workflow runs this first so it can send the
 * "amendment detected, updating" email right away, before the much slower batch sync
 * (minutes, not seconds) runs as its own later step. Does not update
 * plkSchedulesVersion itself -- only the actual sync does that, once it's confirmed
 * the update actually completed.
 *
 * Usage: npm run agent:check-timetable-version
 */
import 'dotenv/config'
import fs from 'node:fs'
import { fetchDataVersion } from '../lib/plkApi'
import { sanitizeForLog } from '../lib/sanitizeForLog'
import { getTimetableInfo } from './payloadClient'

function setOutput(name: string, value: string) {
  const file = process.env.GITHUB_OUTPUT
  if (!file) return
  fs.appendFileSync(file, `${name}=${value}\n`)
}

async function run() {
  const info = await getTimetableInfo()
  const lastVersion = typeof info.plkSchedulesVersion === 'string' ? info.plkSchedulesVersion : null

  const version = await fetchDataVersion()
  const changed = Boolean(version.schedulesVersion) && version.schedulesVersion !== lastVersion

  console.log(`Last-seen schedulesVersion: ${lastVersion === null ? '(none)' : sanitizeForLog(lastVersion)}`)
  console.log(`Current schedulesVersion:   ${version.schedulesVersion ? sanitizeForLog(version.schedulesVersion) : '(unavailable)'}`)
  console.log(changed ? 'Amendment detected.' : 'No amendment -- unchanged since the last run.')

  setOutput('changed', changed ? 'true' : 'false')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
