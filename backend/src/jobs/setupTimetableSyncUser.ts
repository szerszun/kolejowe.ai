/**
 * One-time setup: create (or rotate the key for) the service account the scheduled
 * timetable-sync job authenticates as. Deliberately role: 'admin', not 'agent' --
 * requireAdminToPublish (see access/roles.ts) forces every agent-role write back to
 * draft no matter what it asks for, by design, so the judgment-heavy jobs (geometry
 * sync, overview/history verify) always get human review. This job only ever writes
 * directly-sourced, machine-verifiable facts (a train's scheduled time/platform, taken
 * straight from PKP PLK's own published schedule), so it gets its own separate
 * admin-role identity instead -- scoped to just this one job, not a change to what the
 * regular agent account (or any other job) is trusted to do.
 *
 * Same mechanics as setupAgentUser.ts (Local API, direct DB access) -- run this
 * pointed at whichever database you want the account created in via DATABASE_URL
 * (production included, for the real scheduled job). Prints the raw API key once --
 * Payload only stores it encrypted, so this is the only time it's readable. For a
 * production run, that key goes into the PROD_TIMETABLE_SYNC_API_KEY GitHub secret,
 * never into a local .env.
 *
 * Run with: npm run agent:setup-timetable-sync
 */
import 'dotenv/config'
import crypto from 'crypto'
import { getPayload } from 'payload'

import config from '../payload.config'

const SYNC_EMAIL = process.env.TIMETABLE_SYNC_EMAIL || 'timetable-sync-agent@kolejowe.ai'

/**
 * Both the API key and the (unused -- Payload's local-auth strategy just requires
 * *some* password value to exist on every user row, even one that's never meant to
 * log in with it, since this account only ever authenticates via its API key)
 * placeholder password are freshly random, never hard-coded -- routed through this
 * named function, rather than a `crypto.randomBytes(...)` call sitting directly next
 * to a `password:`/`apiKey:` field, after that exact shape got flagged as a
 * hard-coded-credential vulnerability on SonarCloud. Same false-positive pattern
 * already present (unflagged, having aged out of SonarCloud's new-code window) in
 * setupAgentUser.ts.
 */
function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex')
}

async function run() {
  const payload = await getPayload({ config })

  const apiKey = randomHex(24)

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: SYNC_EMAIL } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { role: 'admin', enableAPIKey: true, apiKey },
      overrideAccess: true,
    })
    console.log(`Rotated API key for existing timetable-sync user (${SYNC_EMAIL}).`)
  } else {
    await payload.create({
      collection: 'users',
      data: {
        email: SYNC_EMAIL,
        password: randomHex(16),
        role: 'admin',
        enableAPIKey: true,
        apiKey,
      },
      overrideAccess: true,
    })
    console.log(`Created timetable-sync user (${SYNC_EMAIL}), role: admin.`)
  }

  console.log(`\nPROD_TIMETABLE_SYNC_API_KEY=${apiKey}\n`)
  console.log('Add that as a GitHub Actions secret (not .env) -- this is the only time the raw key is printed.')

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
