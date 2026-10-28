import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Stations } from './collections/Stations'
import { Lines } from './collections/Lines'
import { Feedback } from './collections/Feedback'
import { TimetableInfo } from './globals/TimetableInfo'
import { reportErrorToSentry } from './hooks/reportErrorToSentry'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Local dev keeps using the SQLite file untouched; set DATABASE_URL to a
// postgres:// connection string (e.g. from a free Neon project) to switch
// -- Render's free web service has an ephemeral filesystem, so a local
// SQLite file there would be wiped on every redeploy/restart.
const databaseUrl = process.env.DATABASE_URL || 'file:./kolejowe.db'
// Postgres schema changes go through the migration files in src/migrations
// (`npm run migrate:create`, see backend/README.md), applied by
// `npm run migrate` in Render's start command before the server starts.
// push is off: Payload never pushes under NODE_ENV=production anyway, so on
// Render it only ever ran when a local script (the seed) was pointed at
// Neon -- where it can drop columns after a y/n prompt. SQLite keeps push.
const db = databaseUrl.startsWith('postgres')
  ? postgresAdapter({
      pool: { connectionString: databaseUrl },
      push: false,
      migrationDir: path.resolve(dirname, 'migrations'),
    })
  : sqliteAdapter({ client: { url: databaseUrl } })

const payloadSecret = process.env.PAYLOAD_SECRET
if (!payloadSecret && process.env.NODE_ENV === 'production') {
  throw new Error('PAYLOAD_SECRET is not set -- required in production (set it in Render\'s environment variables).')
}

// Comma-separated list of extra allowed origins (full "https://..." URLs,
// e.g. a custom domain) on top of the local Vite dev server, which is
// always allowed. CORS_HOST is the same idea but takes just the bare
// Render service name (confirmed empirically: `fromService`'s `host`
// property returns e.g. "kolejowe-frontend", not a full hostname, despite
// its name -- ".onrender.com" has to be appended here), so this is how the
// deployed frontend's origin gets in here without a manual post-deploy step.
const corsHost = process.env.CORS_HOST
const extraCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(corsHost ? [`https://${corsHost}.onrender.com`] : [])

export default buildConfig({
  cors: ['http://localhost:5173', ...extraCorsOrigins],
  // Lines -> stations -> timetable entries -> lines (with full geometry) is a loop, so
  // Payload's default depth of 2 multiplies out: an anonymous `/api/lines?limit=0` built a
  // response past V8's max string length and took the 512MB Render instance down. Nothing
  // here needs more than depth 1 (the frontend's fetchLines/fetchStationDetails), so
  // requests asking for more -- or for nothing, i.e. the default -- are capped to it.
  maxDepth: 1,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Stations, Lines, Feedback],
  globals: [TimetableInfo],
  editor: lexicalEditor(),
  secret: payloadSecret || 'dev-only-insecure-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db,
  sharp,
  hooks: {
    afterError: [reportErrorToSentry],
  },
})
