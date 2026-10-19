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

  const updateLines = result.updates.map((u) => `  ${u.stationId} ${u.kind} ${u.trainNumber}: ${u.field} ${u.from ?? '(none)'} -> ${u.to}`)
  const unmatchedPlkLines = result.unmatchedPlkTrains.map(
    (t) => `  plkStationId ${t.stationPlkId} ${t.kind} train ${t.trainNumber} -- not in our data`,
  )
  const unmatchedEntryLines = result.unmatchedEntries.map(
    (e) => `  ${e.stationId} ${e.kind} train ${e.trainNumber} -- not in today's PLK schedule`,
  )
  const errorLines = result.errors.map((e) => `  ${e.stationId}: ${e.message}`)

  console.log(`Amendment found (schedulesVersion ${result.schedulesVersion}). Checked ${result.stationsChecked} PLK-matched stations.`)
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
    setOutput('summary_text', `The sync job crashed before finishing: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  })
