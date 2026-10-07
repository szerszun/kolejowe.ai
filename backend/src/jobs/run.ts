/**
 * CLI entry point for the scheduled agent job. Intended to be invoked
 * periodically by something external to this process -- a cron box, a
 * scheduled GitHub Action, Payload's own Jobs Queue if you'd rather keep
 * it in-process -- this file itself is just "do one sync pass and exit."
 *
 * Usage:
 *   npm run agent:sync -- 762 753          # sync specific line refs
 *   npm run agent:sync                     # sync the default demo set
 *   npm run agent:sync -- --all            # sync every line in src/data/lines.ts
 *
 * Deliberately does NOT default to "every line" -- Overpass is a shared
 * public service, rate-limits aggressively, and must never be queried
 * concurrently (see src/jobs/overpass.ts), so a full 86-line sweep needs
 * to run slowly and sequentially (this does run sequentially -- it's safe
 * to pass every ref at once -- it'll just take a while). --all opts into
 * that full sweep explicitly, for a scheduled unattended run.
 */
import 'dotenv/config'
import { syncLineGeometry } from './syncLineGeometry'
import { lines as frontendLines } from '../../../src/data/lines'

const DEFAULT_DEMO_REFS = ['762'] // shortest line in the dataset (0.4km, 2 way members) -- fast to demo

async function run() {
  const args = process.argv.slice(2)
  const targets = args.includes('--all')
    ? frontendLines.map((line) => line.number)
    : args.length > 0
      ? args
      : DEFAULT_DEMO_REFS

  console.log(`Syncing ${targets.length} line(s): ${targets.join(', ')}`)

  for (const ref of targets) {
    process.stdout.write(`[${ref}] fetching from Overpass... `)
    try {
      const result = await syncLineGeometry(ref)
      switch (result.outcome) {
        case 'no_published_line':
          console.log('SKIP -- no published line with this ref in Payload.')
          break
        case 'no_active_relation':
          console.log('SKIP -- no active OSM route relation found for this ref.')
          break
        case 'unchanged':
          console.log(`OK -- unchanged (${result.lengthKm}km).`)
          break
        case 'drift_written_as_draft':
          console.log(
            `DRIFT -- ${result.oldLengthKm}km (${result.oldPoints}pt) -> ${result.newLengthKm}km (${result.newPoints}pt). ` +
              `Wrote a draft update. Still draft after write: ${result.stillDraftAfterWrite ? 'yes (correct)' : 'NO -- SECURITY BUG, agent published directly'}.`,
          )
          break
      }
    } catch (err) {
      console.log(`ERROR -- ${(err as Error).message}`)
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
