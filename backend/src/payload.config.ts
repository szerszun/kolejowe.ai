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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Local dev keeps using the SQLite file untouched; set DATABASE_URL to a
// postgres:// connection string (e.g. from a free Neon project) to switch
// -- Render's free web service has an ephemeral filesystem, so a local
// SQLite file there would be wiped on every redeploy/restart.
const databaseUrl = process.env.DATABASE_URL || 'file:./kolejowe.db'
// This project has no migration files anywhere (confirmed: `find . -iname
// "*migrat*"` turns up nothing) -- it has only ever relied on Payload's
// dev-style schema push, same as the sqlite adapter above. `push` defaults
// to off once NODE_ENV=production (which Render's build sets), so it's
// forced on here to keep that same no-migrations workflow working on
// Postgres. Fine for this project's current scale; a real migration setup
// would be the more correct long-term answer.
const db = databaseUrl.startsWith('postgres')
  ? postgresAdapter({ pool: { connectionString: databaseUrl }, push: true })
  : sqliteAdapter({ client: { url: databaseUrl } })

const payloadSecret = process.env.PAYLOAD_SECRET
if (!payloadSecret && process.env.NODE_ENV === 'production') {
  throw new Error('PAYLOAD_SECRET is not set -- required in production (set it in Render\'s environment variables).')
}

// Comma-separated list of extra allowed origins (full "https://..." URLs,
// e.g. a custom domain) on top of the local Vite dev server, which is
// always allowed. CORS_HOST is the same idea but takes a bare hostname --
// Render's `fromService` blueprint wiring can only produce a hostname, not
// a full URL, so this is how the deployed frontend's origin gets in here
// without a manual post-deploy step.
const corsHost = process.env.CORS_HOST
const extraCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(corsHost ? [`https://${corsHost}`] : [])

export default buildConfig({
  cors: ['http://localhost:5173', ...extraCorsOrigins],
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
})
