# kolejowe.ai — Lower Silesia Railways Explorer

Interactive map for exploring railway lines in the Dolnośląskie voivodeship,
backed by a real Payload CMS backend and live PKP PLK arrivals/departures
data. Deployed at kolejoweai.onrender.com (frontend) and
kolejowe-backend-eu.onrender.com (API, Render Frankfurt -- next to the Neon
database in eu-central-1).

## Stack

- React 19 + TypeScript + Vite; MapLibre GL JS (tiles from
  [OpenFreeMap](https://openfreemap.org/)); react-router-dom for
  `/line/:number` and `/station/:id` deep links
- `backend/` — Payload CMS (Next.js), source of truth for line/station data;
  SQLite locally, Postgres (Neon) in production — see `backend/README.md`
- Vitest (unit) + Playwright (E2E/API) regression suite, SonarCloud code
  quality analysis, GitHub Actions CI on every push/PR to `main`

## Running it

```bash
# terminal 1 -- backend (first time: npm install && cp .env.example .env && npm run seed)
cd backend && npm run dev

# terminal 2 -- frontend
npm install
npm run dev
```

The frontend shows a loading/error state if it can't reach the backend at
`http://localhost:3000` (configurable via `VITE_PAYLOAD_URL`) — see
`backend/README.md` for first-time setup.

## Testing

```bash
npm test
```

Runs Vitest unit tests, the full Playwright suite (E2E + API + a production
build smoke test), and writes a go/no-go report to
`test-results/executive-summary.html` (exit code reflects the verdict). CI
also posts the same verdict + SonarCloud summary to the GitHub Actions run's
job summary and emails it after a push to `main`. See
`tests/report/generate-report.mjs` and `.github/workflows/regression.yml`.

## What's implemented

- Map of 86 lines across Lower Silesia with real OpenStreetMap-derived
  geometry and stations, status/electrification styling, search, filters,
  deep links, and a legend
- Line and station detail panels (Overview/History/Tenders and
  Overview/Timetable/Arrivals/Departures respectively)
- **Live PKP PLK arrivals/departures** — real API, server-side cached and
  quota-aware (100 req/hour free tier), falls back to the static timetable
  with a visible warning when the feed is unavailable rather than showing
  fabricated status
- PL/EN interface toggle, responsive layout (bottom sheet on mobile)
- Backend agent jobs (manually invoked, not yet scheduled): OSM geometry
  sync, and an LLM web-search agent that checks line overview/history facts
  against the live web and drafts corrections for human review

## Not yet real

- Station/history/tender content is still hand-authored sample data, not
  synced from an external source (Notion or otherwise)
- No tender-to-line auto-matching
- The agent jobs above exist and work, but nothing schedules them yet (no
  cron) — they're run by hand
- No AI assistant/chat (an earlier mock version was removed; a real one
  would need retrieval + an LLM call behind the backend)
- WCAG 2.1 AA not formally audited

## Next steps

- Schedule the geometry/overview/history agent jobs instead of manual runs
- Real content pipeline for station details and tenders
- Keep expanding line coverage (see git history for the line-by-line
  OSM geometry build-out — a handful of obscure sidings likely remain)
- Resolve Gmail deliverability for the CI report email (the GitHub Actions
  job summary already covers this reliably in the meantime)
