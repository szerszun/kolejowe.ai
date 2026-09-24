# kolejowe.ai — Lower Silesia Railways Explorer

Interactive map + AI assistant for exploring railway lines in the Dolnośląskie
voivodeship. This repo currently contains the **v1 draft**: a frontend-only
prototype built against a hand-authored sample dataset, so the map, details
panel and chat UX can be reviewed before the real backend, Notion sync and
LLM integration are built.

See `kolejowe.ai v1 Technical Specification.pdf` (project owner's copy) for
the full requirements this UI is tracking.

## Stack

- React 19 + TypeScript + Vite
- MapLibre GL JS, tiles from [OpenFreeMap](https://openfreemap.org/) (no usage billing)
- react-router-dom for `/line/:number` deep links
- No backend yet — data lives in `src/data/lines.ts`, chat answers come from
  a keyword-matching mock in `src/components/Chat/mockAssistant.ts`

## Running it

```bash
npm install
npm run dev
```

## What's implemented (draft scope)

- Interactive map of 10 sample lines across Lower Silesia, colour-coded by
  status (active passenger / freight only / planned / closed), with a
  legend, hover tooltips, click-to-select + zoom-to-fit, and open-tender
  badges
- Deep-linkable line selection (`/line/274`) via the URL
- Search by line number / station / town, plus status / electrified / has
  open tenders filters — also usable as a fully keyboard/screen-reader
  accessible list, not just via the map
- Details panel with Overview / History / Tenders tabs, source + last
  updated on every section, and a proper empty state for tenders
- Floating AI chat: streams in answers, always cites a source, refuses
  and suggests where to look when it has no matching data, answers in the
  language of the question, highlights mentioned lines on the map,
  per-line suggested questions, session-only history, and a client-side
  30 msgs/hour limit
- PL (default) / EN interface toggle
- Responsive layout (details panel becomes a bottom sheet on narrow screens)

## Explicitly stubbed / not yet real

- **Data**: `src/data/lines.ts` is hand-written sample data with simplified
  straight-line geometry between real towns — not surveyed track alignment,
  not synced from Notion. The region border in `src/data/regionBorder.ts` is
  a rough hand-drawn outline, not an official boundary.
- **AI assistant**: `mockAssistant.ts` answers via keyword matching against
  the same sample data. No real retrieval, no LLM call, no protection
  against prompt injection yet — all of that needs the real backend.
- **Backend**: none. No FastAPI/PostGIS/pgvector, no overnight Notion sync
  job, no tender-to-line auto-matching pipeline.
- Line 275's "manually curated" flag is just a UI badge here — the real
  dedicated-Notion-structure workflow doesn't exist yet.

## Not built at all yet (mostly "Could" in the spec)

- Station markers below zoom 10 tuning / elevation profile
- Full offline/PWA or mobile app packaging (out of scope for v1 anyway)
- Cookie-less analytics, GDPR-compliant chat log retention (needs a backend)
- WCAG 2.1 AA audit — semantics and keyboard paths are in place, but this
  hasn't been formally tested against the standard

## Suggested next steps

1. Stand up the FastAPI + PostgreSQL/PostGIS backend and replace
   `src/data/lines.ts` with real API calls
2. Wire the Notion sync job for line overview/history/tenders
3. Replace `mockAssistant.ts` with real retrieval (pgvector) + an LLM call
   behind the backend (key never in the frontend)
4. Replace sample geometry with real PKP PLK / OSM line alignments
