/**
 * CLI entry point for the weekly overview ("Informacje" tab) verification
 * agent. Mirrors run.ts (the geometry sync entry point) -- see that file
 * for why this deliberately doesn't default to "every line" and processes
 * refs sequentially rather than concurrently.
 *
 * Usage:
 *   npm run agent:verify-overview -- 762 753   # verify specific line refs
 *   npm run agent:verify-overview               # verify the default demo set
 *   npm run agent:verify-overview -- --all       # verify every line
 */
import 'dotenv/config'
import { verifyOverviewLine } from './verifyOverview'
import { lines as frontendLines } from '../../../src/data/lines'

const DEFAULT_DEMO_REFS = ['762']

async function run() {
  const args = process.argv.slice(2)
  const targets = args.includes('--all')
    ? frontendLines.map((line) => line.number)
    : args.length > 0
      ? args
      : DEFAULT_DEMO_REFS

  console.log(`Verifying overview for ${targets.length} line(s): ${targets.join(', ')}`)

  for (const ref of targets) {
    process.stdout.write(`[${ref}] researching... `)
    try {
      const result = await verifyOverviewLine(ref)
      switch (result.outcome) {
        case 'no_published_line':
          console.log('SKIP -- no published line with this ref in Payload.')
          break
        case 'unchanged':
          console.log(`OK -- no significant change. lastUpdated bumped. (${result.reasoning})`)
          break
        case 'updated_as_draft':
          console.log(
            `UPDATED -- fields [${result.fields.join(', ')}] written as draft. Source: ${result.sourceUrl}. ${result.reasoning}`,
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
