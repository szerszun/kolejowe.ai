/**
 * Standalone entry point for `npm run admin:setup` -- re-syncs the admin
 * and agent accounts without touching station/line data. `npm run seed`
 * already calls the same logic at the end of a full re-seed; use this when
 * you just need the accounts fixed (e.g. after manually editing .env) and
 * don't want to re-seed everything else.
 */
import 'dotenv/config'

import { ensureUsers } from './ensureUsers'

ensureUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
