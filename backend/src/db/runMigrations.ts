/**
 * `npm run migrate`: applies src/migrations to Postgres. Runs in Render's start
 * command before `next start`, so a failed migration fails the deploy and the
 * previous version keeps serving. Does nothing on SQLite (local dev pushes).
 *
 * Not `payload migrate`: production's schema was created by Payload's dev-mode
 * push (the seed, run from a laptop against Neon), which leaves a `dev` row
 * (batch -1) in payload_migrations. Payload's migrate() stops at an interactive
 * "data loss will occur" prompt when it sees one, and Render has no terminal to
 * answer it. The baseline migration takes over from that push, so the row goes.
 *
 * Afterwards it compares the database with the schema in code (drizzle-kit's
 * push diff, computed but not applied) and fails if they differ, so drift shows
 * up in the deploy log instead of as a 500 later.
 */
import 'dotenv/config'
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload, type Migration } from 'payload'

import config from '../payload.config'
import { migrations } from '../migrations'

async function run() {
  const payload = await getPayload({ config })
  if (payload.db.name !== 'postgres') {
    payload.logger.info('Not Postgres -- nothing to migrate (SQLite uses schema push).')
    process.exit(0)
  }
  const db = payload.db as unknown as PostgresAdapter

  const { rows } = await db.drizzle.execute(sql`SELECT to_regclass('payload_migrations') AS t`)
  if (rows[0]?.t) {
    await payload.delete({ collection: 'payload-migrations', where: { batch: { equals: -1 } } })
  }
  // Same array Payload's own prodMigrations option takes; migrate() is typed for the generic adapter.
  await db.migrate({ migrations: migrations as unknown as Migration[] })

  const { pushSchema } = db.requireDrizzleKit()
  // Payload's drizzle-kit type leaves out statementsToExecute, which pushSchema does return.
  const { statementsToExecute } = (await pushSchema(
    db.schema,
    db.drizzle,
    db.schemaName ? [db.schemaName] : undefined,
    db.tablesFilter,
    db.extensions.postgis ? ['postgis'] : undefined,
  )) as unknown as { statementsToExecute: string[] }
  // Column defaults only warn: drizzle-kit reads numeric defaults back from Postgres in a
  // form it never matches, so it always reports `users.login_attempts SET DEFAULT 0` --
  // even right after the baseline created that column with exactly that default.
  const isDefaultOnly = (s: string) => /^ALTER TABLE .+ ALTER COLUMN .+ SET DEFAULT .+;?$/.test(s)
  const drift = statementsToExecute.filter((s) => !isDefaultOnly(s))
  const defaults = statementsToExecute.filter(isDefaultOnly)
  if (defaults.length) {
    payload.logger.warn(`Column defaults drizzle-kit reports as different:\n${defaults.join('\n')}`)
  }
  if (drift.length) {
    payload.logger.error(
      `Database schema differs from the code -- a migration is missing (npm run migrate:create). ` +
        `Statements push would run:\n${drift.join('\n')}`,
    )
    process.exit(1)
  }
  payload.logger.info('Migrations applied; database schema matches the code.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
