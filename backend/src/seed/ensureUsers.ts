/**
 * Idempotent: make sure the admin and agent service accounts exist, with
 * stable credentials that survive wiping and re-seeding the SQLite database.
 *
 * The database file is gitignored and gets rebuilt from scratch whenever the
 * static line/station data changes (see seed.ts) -- that wipes out any user
 * created by hand through the admin UI. Credentials for both accounts are
 * generated once and persisted in .env (also gitignored, but it lives on
 * disk independently of the DB file), so every re-seed recreates the exact
 * same login rather than a new random one.
 *
 * Called automatically at the end of `npm run seed`. Safe to run on its own
 * too (`tsx src/seed/ensureUsers.ts`) -- does nothing if both users already
 * exist with current credentials.
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { getPayload, type Payload } from 'payload'

import config from '../payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.join(__dirname, '../../.env')

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kolejowe.ai'
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

  const { value: adminPassword, wasGenerated: adminGenerated } = ensureEnvSecret('ADMIN_PASSWORD', () =>
    crypto.randomBytes(18).toString('base64url'),
  )
  const { value: agentApiKey, wasGenerated: agentGenerated } = ensureEnvSecret('AGENT_API_KEY', () =>
    crypto.randomBytes(24).toString('hex'),
  )

  // --- admin user (email + password login to /admin) ---
  const existingAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
    overrideAccess: true,
  })

  if (existingAdmin.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: { email: ADMIN_EMAIL, password: adminPassword, role: 'admin' },
      overrideAccess: true,
    })
    console.log(`Created admin user: ${ADMIN_EMAIL}`)
  } else {
    // DB was wiped and recreated -- Payload hashes passwords, so a fresh
    // row never matches the persisted .env password on its own; reset it
    // explicitly so the same credentials keep working after every re-seed.
    await payload.update({
      collection: 'users',
      id: existingAdmin.docs[0].id,
      data: { password: adminPassword, role: 'admin' },
      overrideAccess: true,
    })
    console.log(`Admin user already present, password re-synced: ${ADMIN_EMAIL}`)
  }

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

  if (adminGenerated) {
    console.log(`\nGenerated a new ADMIN_PASSWORD and saved it to .env (not printed again after this).`)
  }
  if (agentGenerated) {
    console.log(`Generated a new AGENT_API_KEY and saved it to .env.`)
  }
  console.log(`\nAdmin login: ${ADMIN_EMAIL} / see ADMIN_PASSWORD in backend/.env`)
}

export { run as ensureUsers }
