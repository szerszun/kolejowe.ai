/**
 * One-time setup: create (or rotate the key for) the service account the
 * scheduled sync job authenticates as. Prints the raw API key once --
 * Payload only stores it encrypted, so this is the only time it's
 * readable. Put it in .env as AGENT_API_KEY.
 *
 * Run with: npm run agent:setup
 */
import 'dotenv/config'
import crypto from 'crypto'
import { getPayload } from 'payload'

import config from '../payload.config'

const AGENT_EMAIL = process.env.AGENT_EMAIL || 'line-sync-agent@kolejowe.ai'

async function run() {
  const payload = await getPayload({ config })

  const apiKey = crypto.randomBytes(24).toString('hex')

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: AGENT_EMAIL } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { enableAPIKey: true, apiKey },
      overrideAccess: true,
    })
    console.log(`Rotated API key for existing agent user (${AGENT_EMAIL}).`)
  } else {
    await payload.create({
      collection: 'users',
      data: {
        email: AGENT_EMAIL,
        password: crypto.randomBytes(16).toString('hex'), // unused -- API key only
        role: 'agent',
        enableAPIKey: true,
        apiKey,
      },
      overrideAccess: true,
    })
    console.log(`Created agent user (${AGENT_EMAIL}).`)
  }

  console.log(`\nAGENT_API_KEY=${apiKey}\n`)
  console.log('Add that line to .env -- this is the only time the raw key is printed.')

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
