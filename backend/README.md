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

## Not done yet

- No seed script moving the current `src/data/lines.ts` / `geometry/*.json`
  / `stationDetails.ts` into Payload.
- No scheduled agent job (Overpass re-fetch -> dedup/stitch -> draft write).
- Frontend still reads the static `src/data/lines.ts`, not this API.
- No production deploy config (Docker/hosting) -- removed the template's
  Mongo-flavoured `docker-compose.yml` and a `Dockerfile` that assumed
  `output: 'standalone'`, which isn't set yet.
