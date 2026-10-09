/**
 * Standalone entry point for `npm run agent:ensure` -- re-syncs the agent
 * service account without touching station/line data. `npm run seed`
 * already calls the same logic at the end of a full re-seed; use this when
 * you just need that account fixed (e.g. after manually editing .env) and
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
