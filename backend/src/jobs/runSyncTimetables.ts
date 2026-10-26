/**
 * CLI entry point for the scheduled timetable sync job. Prints a human-readable
 * summary and, when running inside GitHub Actions (GITHUB_OUTPUT is set), writes
 * step outputs the workflow uses to decide which emails to send -- see
 * .github/workflows/sync-timetables.yml.
 *
 * Usage: npm run agent:sync-timetables
 */
import 'dotenv/config'
import fs from 'node:fs'
import { sanitizeForLog as s } from '../lib/sanitizeForLog'
import { syncTimetables } from './syncTimetables'

function setOutput(name: string, value: string) {
  const file = process.env.GITHUB_OUTPUT
  if (!file) return
  fs.appendFileSync(file, `${name}<<EOF\n${value}\nEOF\n`)
}

async function run() {
  const result = await syncTimetables()

  if (result.outcome === 'unchanged') {
    console.log('No amendment: PLK schedulesVersion unchanged since the last run. Nothing to do.')
    setOutput('changed', 'false')
    return
  }

  const updateLines = result.updates.map((u) => `  ${s(u.stationId)} ${s(u.kind)} ${s(u.trainNumber)}: ${s(u.field)} ${u.from == null ? '(none)' : s(u.from)} -> ${s(u.to)}`)
  const unmatchedPlkLines = result.unmatchedPlkTrains.map(
    (t) => `  plkStationId ${s(t.stationPlkId)} ${s(t.kind)} train ${s(t.trainNumber)} -- not in our data`,
  )
  const unmatchedEntryLines = result.unmatchedEntries.map(
    (e) => `  ${s(e.stationId)} ${s(e.kind)} train ${s(e.trainNumber)} -- not in today's PLK schedule`,
  )
  const errorLines = result.errors.map((e) => `  ${s(e.stationId)}: ${s(e.message)}`)

  console.log(`Amendment found (schedulesVersion ${s(result.schedulesVersion)}). Checked ${result.stationsChecked} PLK-matched stations.`)
  console.log(`${result.updates.length} entries updated.`)
  if (updateLines.length) console.log(updateLines.join('\n'))
  console.log(`${result.unmatchedPlkTrains.length} PLK trains with no matching entry (not created).`)
  if (unmatchedPlkLines.length) console.log(unmatchedPlkLines.slice(0, 50).join('\n'))
  console.log(`${result.unmatchedEntries.length} existing entries not found in today's schedule (not removed).`)
  if (unmatchedEntryLines.length) console.log(unmatchedEntryLines.slice(0, 50).join('\n'))
  if (errorLines.length) {
    console.log(`${result.errors.length} station(s) failed:`)
    console.log(errorLines.join('\n'))
  }

  setOutput('changed', 'true')
  setOutput(
    'summary_text',
    [
      `Amendment found and applied. Checked ${result.stationsChecked} stations.`,
      `${result.updates.length} entries updated, ${result.unmatchedPlkTrains.length} new PLK trains not added, ${result.unmatchedEntries.length} existing entries not found today, ${result.errors.length} station(s) errored.`,
      '',
      'Updates:',
      ...(updateLines.length ? updateLines.slice(0, 200) : ['  (none)']),
      '',
      'Unmatched PLK trains (not created automatically -- add manually if genuinely new):',
      ...(unmatchedPlkLines.length ? unmatchedPlkLines.slice(0, 100) : ['  (none)']),
      '',
      "Existing entries not found in today's schedule (not removed automatically -- review manually):",
      ...(unmatchedEntryLines.length ? unmatchedEntryLines.slice(0, 100) : ['  (none)']),
      ...(errorLines.length ? ['', 'Errors:', ...errorLines] : []),
    ].join('\n'),
  )
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    setOutput('changed', 'error')
    setOutput('summary_text', `The sync job crashed before finishing: ${s(err instanceof Error ? err.message : err)}`)
    process.exit(1)
  })
