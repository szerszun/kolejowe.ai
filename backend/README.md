# kolejowe.ai backend (Payload CMS)

Payload CMS backend for kolejowe.ai. Intended to become the source of truth
for line/station data, replacing `../src/data/lines.ts` in the frontend.
Scaffolded manually against the real `payload@3.90.2` template (the
`create-payload-app` CLI wizard isn't usable in a non-interactive shell, and
the `main` branch template on GitHub is ahead of what's published to npm --
see git history for the exact fix).

## Local setup

```bash
cp .env.example .env   # already done; .env has a generated PAYLOAD_SECRET
npm install
npm run dev
```

Open `http://localhost:3000/admin` and follow the prompts to create the
first admin user (give it `role: admin`).

Database is SQLite (`kolejowe.db`, gitignored) via `@payloadcms/db-sqlite` --
zero external services needed for local dev. Swapping to Postgres later
(for PostGIS parity with the planned region/geo queries) is a one-line
change in `src/payload.config.ts`: swap `sqliteAdapter` for
`@payloadcms/db-postgres`'s `postgresAdapter`; the collection configs don't
need to change.

## Collections

- **`stations`** -- one doc per canonical OSM station (`id` field holds
  `osm-<id>`, matching the current frontend's station ids). Shared across
  every line that serves it.
- **`lines`** -- mirrors the `RailwayLine` type from the frontend: status,
  electrified, lengthKm, tracks, maxSpeedKmh, operators, endStations, a
  `stations` relationship (in geometry order), `geometry` as a JSON
  `[lon, lat][]` array (same shape as `src/data/geometry/*.json`), history,
  tenders, sources.
- **`media`** -- uploads, for station photos.
- **`users`** -- has a `role` field (`admin` / `agent` / `viewer`).

## Draft / publish workflow

`stations` and `lines` have `versions.drafts` enabled, so every write is
versioned and nothing goes live without an explicit publish.

The `requireAdminToPublish` hook (`src/access/roles.ts`) force-downgrades
any write with `_status: "published"` back to `"draft"` unless the
requesting user has `role: "admin"` -- so an agent's API key can create and
update drafts all day, but can never publish. Only a human admin publishing
from the admin UI (or an admin-authenticated API call) makes a change live.

`lines.changeSummary` is a sidebar field for the agent to explain what it
changed and why/from-what-source on each draft -- read it before publishing.

**Gotcha found while writing the seed script**: `draft: false` on a Local
API `create`/`update` does *not* by itself flip `_status` to `"published"`
in this Payload version, even with `overrideAccess: true` and even
(tested) via an authenticated admin REST `PATCH`. The fix is to include
`_status: 'published'` explicitly in the submitted `data`. The real
workflow -- an admin clicking "Publish changes" in the admin UI -- already
submits `_status` that way itself and works correctly; this only bit the
scripted/API path. See `src/seed/seed.ts` for the working pattern if you
write another script that needs to publish.

## Seeding

```bash
npm run seed
```

Migrates everything currently in `../src/data/lines.ts` +
`../src/data/stationDetails.ts` into Payload as published documents: 44
lines, 347 unique stations, and the 4 real Wikimedia station photos
(downloaded and uploaded into `media`). Safe to re-run only against an
empty database -- it always creates (not upserts), so a second run against
existing data will fail on duplicate ids. `src/seed/verify.ts` does a
quick sanity read-back afterward (counts, one line, one station) if you
want to check it worked without opening the admin UI.

## Schema changes (migrations)

Local SQLite still updates its schema automatically (Payload's dev push).
Production Postgres doesn't: every schema change -- a new, renamed or
removed field, a new option on a select -- needs a migration file, committed
with the change:

```bash
DATABASE_URL=postgres://unused npm run migrate:create -- add_station_wifi
```

The command needs no database. It compares the config with the latest
snapshot in `src/migrations/` and writes the SQL for the difference. Read
it before committing, especially any `DROP`. Render runs `npm run migrate`
before starting each new version (`src/db/runMigrations.ts`). If the
migration fails, or the database still differs from the code, the new version
doesn't start and the old one keeps serving. CI's `migrations` job runs the
same check against an empty Postgres, so a forgotten migration fails the PR.

Don't point `npm run seed` (or anything else that opens Payload) at the
production `DATABASE_URL` expecting it to fix the schema: push is off for
Postgres, so it won't.

## Scheduled agent job

```bash
npm run agent:setup        # one-time: creates the agent user + API key, paste the key into .env
npm run agent:sync -- 762  # sync specific line refs (sequential, never concurrent -- see src/jobs/overpass.ts)
npm run agent:sync         # no refs given -> syncs a small built-in demo set
```

`src/jobs/overpass.ts` is a TS port of this project's Overpass fetch +
duplicate-parallel-track dedup + stitch pipeline, scoped for drift
*detection* against an already-published geometry rather than building one
from scratch (no region-border clipping -- a line that legitimately
crosses the Dolnoslaskie border, like 271/273/275/277/282, will always
look "changed" here even with no real update).

`src/jobs/syncLineGeometry.ts` re-fetches a line, compares it to what's
published, and -- if different -- PATCHes a draft update, authenticated
over REST with the agent's own API key (not the trusted Local API, the
same constraint a real external cron/GitHub Action would have). Verified
end-to-end against a deliberately mutated line: an admin's "Publish
changes" works; the agent's write always lands as a draft; a plain GET
keeps serving the old published content untouched while the draft sits in
version history pending review.

**Two gotchas found getting that verification to actually pass**, both
fixed in `src/jobs/overpass.ts` / `syncLineGeometry.ts`:
- A `fetch()` with no timeout can hang forever on a connection that just
  never responds, which silently defeats a retry loop that only triggers
  on rejection -- added `AbortSignal.timeout`.
- Sending `draft=true` (save as draft) and `_status: 'published'` (the
  agent's nominal publish request, which `requireAdminToPublish` demotes
  anyway) in the same PATCH is a contradictory pair of signals -- it left
  the live document pointing at the new unapproved content instead of the
  still-current published version. Only ever request `draft=true`, don't
  also send `_status`.

(Separate from the above: see the Seeding section below for a *different*
gotcha with Local API create/update specifically.)

## Not done yet

- Frontend still reads the static `src/data/lines.ts`, not this API.
- No production deploy config (Docker/hosting) -- removed the template's
  Mongo-flavoured `docker-compose.yml` and a `Dockerfile` that assumed
  `output: 'standalone'`, which isn't set yet.
- The agent job only checks geometry drift. Nothing re-checks station
  details, tenders, or anything else sourced outside OSM.
