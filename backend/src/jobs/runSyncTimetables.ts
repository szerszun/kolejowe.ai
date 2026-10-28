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
    (e) => `  ${s(e.stationId)} ${s(e.kind)} train ${s(e.trainNumber)} -- not in PLK's schedule for the window`,
  )
  const errorLines = result.errors.map((e) => `  ${s(e.stationId)}: ${s(e.message)}`)

  // schedulesVersion is left out on purpose: it's raw PLK API response data (SonarCloud
  // tssecurity:S5145 doesn't accept sanitizeForLog as a sanitizer), and the check step
  // already logs it right before this one runs.
  const windowText = `${result.window.from} to ${result.window.to}`
  const versionNote = result.versionSaved
    ? 'PLK version saved -- the next run only syncs again after a new amendment.'
    : `PLK version NOT saved because ${result.errors.length} station(s) failed -- the next run retries them.`
  console.log(`Amendment found. Checked ${result.stationsChecked} PLK-matched stations against PLK's schedule for ${windowText}.`)
  console.log(`${result.updates.length} entries updated.`)
  if (updateLines.length) console.log(updateLines.join('\n'))
  console.log(`${result.unmatchedPlkTrains.length} PLK trains with no matching entry (not created).`)
  if (unmatchedPlkLines.length) console.log(unmatchedPlkLines.slice(0, 50).join('\n'))
  console.log(`${result.unmatchedEntries.length} existing entries not found in PLK's schedule for ${windowText} (not removed).`)
  if (unmatchedEntryLines.length) console.log(unmatchedEntryLines.slice(0, 50).join('\n'))
  if (result.confirmedAfter5xx) console.log(`${result.confirmedAfter5xx} station write(s) got a 5xx but were confirmed saved on read-back.`)
  if (errorLines.length) {
    console.log(`${result.errors.length} station(s) failed:`)
    console.log(errorLines.join('\n'))
  }
  console.log(versionNote)

  setOutput('changed', 'true')
  setOutput(
    'summary_text',
    [
      `Amendment found and applied. Checked ${result.stationsChecked} stations against PLK's schedule for ${windowText}.`,
      `${result.updates.length} entries updated, ${result.unmatchedPlkTrains.length} new PLK trains not added, ${result.unmatchedEntries.length} existing entries not found in the window, ${result.errors.length} station(s) errored` +
        (result.confirmedAfter5xx ? ` (${result.confirmedAfter5xx} more got a 5xx but were confirmed saved).` : '.'),
      versionNote,
      '',
      'Updates:',
      ...(updateLines.length ? updateLines.slice(0, 200) : ['  (none)']),
      '',
      'Unmatched PLK trains (not created automatically -- add manually if genuinely new):',
      ...(unmatchedPlkLines.length ? unmatchedPlkLines.slice(0, 100) : ['  (none)']),
      '',
      "Existing entries not found in PLK's schedule for the window (not removed automatically -- review manually):",
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
