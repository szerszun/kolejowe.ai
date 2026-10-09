/**
 * Idempotent: make sure the agent service account exists, with a stable API
 * key that survives wiping and re-seeding the database.
 *
 * The database gets rebuilt from scratch whenever the static line/station
 * data changes (see seed.ts) -- that wipes out any user created by hand.
 * The agent's API key is generated once and persisted in .env (gitignored,
 * lives on disk independently of the DB), so every re-seed recreates the
 * exact same credential rather than a new random one.
 *
 * Does NOT create or touch an admin account -- that bootstrap was removed
 * (an auto-created admin with a password shared between local and
 * production was judged a standing security risk now that the backend is
 * publicly deployed). Create an admin manually through Payload's own
 * "create first user" flow if the users collection is ever fully empty, or
 * via a one-off script you delete afterward.
 *
 * Called automatically at the end of `npm run seed`. Safe to run on its own
 * too (`tsx src/seed/ensureUsers.ts`) -- does nothing if the agent already
 * exists with current credentials.
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { getPayload, type Payload } from 'payload'

import config from '../payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.join(__dirname, '../../.env')

const AGENT_EMAIL = process.env.AGENT_EMAIL || 'line-sync-agent@kolejowe.ai'

function readEnvValue(key: string): string | undefined {
  if (!fs.existsSync(ENV_PATH)) return undefined
  const line = fs
    .readFileSync(ENV_PATH, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${key}=`))
  return line ? line.slice(key.length + 1).trim() : undefined
}

function appendEnvValue(key: string, value: string) {
  const existing = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''
  const needsNewline = existing.length > 0 && !existing.endsWith('\n')
  fs.appendFileSync(ENV_PATH, `${needsNewline ? '\n' : ''}${key}=${value}\n`)
}

function ensureEnvSecret(key: string, generate: () => string): { value: string; wasGenerated: boolean } {
  const fromProcess = process.env[key]
  if (fromProcess) return { value: fromProcess, wasGenerated: false }

  const fromFile = readEnvValue(key)
  if (fromFile) {
    process.env[key] = fromFile
    return { value: fromFile, wasGenerated: false }
  }

  const value = generate()
  appendEnvValue(key, value)
  process.env[key] = value
  return { value, wasGenerated: true }
}

async function run(existingPayload?: Payload) {
  const payload = existingPayload ?? (await getPayload({ config }))

  const { value: agentApiKey, wasGenerated: agentGenerated } = ensureEnvSecret('AGENT_API_KEY', () =>
    crypto.randomBytes(24).toString('hex'),
  )

  // --- agent service account (API key only, used by the sync job) ---
  const existingAgent = await payload.find({
    collection: 'users',
    where: { email: { equals: AGENT_EMAIL } },
    limit: 1,
    overrideAccess: true,
  })

  if (existingAgent.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: AGENT_EMAIL,
        password: crypto.randomBytes(16).toString('hex'), // unused -- API key only
        role: 'agent',
        enableAPIKey: true,
        apiKey: agentApiKey,
      },
      overrideAccess: true,
    })
    console.log(`Created agent user: ${AGENT_EMAIL}`)
  } else {
    await payload.update({
      collection: 'users',
      id: existingAgent.docs[0].id,
      data: { enableAPIKey: true, apiKey: agentApiKey, role: 'agent' },
      overrideAccess: true,
    })
    console.log(`Agent user already present, API key re-synced: ${AGENT_EMAIL}`)
  }

  if (agentGenerated) {
    console.log(`Generated a new AGENT_API_KEY and saved it to .env.`)
  }
}

export { run as ensureUsers }
