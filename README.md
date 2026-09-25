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

- Interactive map of 21 lines across Lower Silesia, most with **real
  OpenStreetMap-derived alignments** (see Data below), each with its own
  distinguishable colour (30-colour palette, no yellow — it disappears
  against the basemap); status (active passenger / freight only / planned /
  closed) is conveyed by line style (solid / dashed / dotted) plus a legend,
  with hover tooltips, click-to-select + zoom-to-fit, and open-tender badges
- Deep-linkable line selection (`/line/274`) and station selection
  (`/station/<id>`) via the URL — clicking a station on the map, or a station
  name inside a line's Overview tab, opens a dedicated station panel with its
  own Overview / Timetable / Arrivals / Departures tabs (photo, address,
  year built, platform count, accessibility notes and amenities where
  hand-authored — currently Wrocław Główny, Legnica, Jelenia Góra and
  Wałbrzych Główny; other stations fall back to just their serving-lines
  list); the Timetable tab has a destination/operator/line-number search
  box; the Arrivals and Departures tabs each derive "next 6 hours"
  live-style movements from the same sample timetable data (origin vs.
  destination), with a deterministic mock on-time/delayed/cancelled status
  standing in for real PKP PLK dispatch data
- Search by line number/name or station name (once real station data was
  in place, town-only matches were dropped in favour of matching real
  stations directly), shown as separate Lines/Stations result sections with
  a train-station icon for station results, plus status / electrified / has
  open tenders filters (status chips start unselected — showing everything —
  and narrow the map to the union of whichever chips are clicked, rather
  than starting all-selected and excluding on click) — also usable as a
  fully keyboard/screen-reader accessible list, not just via the map
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

- **Line geometry**: `src/data/geometry/*.json` holds real OpenStreetMap
  alignments (© OpenStreetMap contributors, ODbL) for **all 21 lines** — the
  two that used to be hand-drawn fictional geometry (293, 321) have been
  replaced: 293's ref didn't actually belong to the "Legnica–Głogów" pairing
  it was assigned (that ref is an unrelated line in Opolskie), so that entry
  is now real line **289 Legnica–Rudna Gwizdanów** (the actual Zagłębie
  Miedziowe freight line the fictional one stood in for); 321's fictional
  "Jelenia Góra–Świeradów-Zdrój" never corresponded to real geography
  (Szklarska Poręba and Świeradów-Zdrój are in different valleys, never
  connected by one line), so that entry is now real line **317 Gryfów
  Śląski–Świeradów-Zdrój**, reactivated for tourism like line 340 to
  Karpacz. See the comments at the top of `src/data/lines.ts` and per-line
  comments for the fetch/stitch/clip pipeline and each line's caveats: 137
  (Legnica–Nysa fork) and 271 (Poznań–Wrocław Główny) both required manually
  matching every OSM way fragment's real endpoints after the automatic
  longest-chain heuristic either picked too short a piece or stitched some
  fragments backwards; 286 and 132 had real duplicate-parallel-track
  segments in the OSM data that were originally concatenated instead of
  deduplicated, producing U-turns/backtracks that are now fixed; 289 only
  reaches partway to its real endpoint (Rudna Gwizdanów); lines that
  continue beyond the region, like 273, 275 and 271, are simply cut off at
  the border. All lines with real geometry also have real intermediate
  stations — matched by proximity to each line's path from a region-wide
  query of OSM `railway=station`/`halt` nodes (plus
  `construction:railway`/`disused:railway` for stations mid-renovation on
  newly reactivated lines, e.g. Złotoryja on 284), using each station's real
  OSM node id as a canonical id shared across lines (so a station served by
  several lines, e.g. Wrocław Główny, correctly lists all of them instead of
  just one). All other data (history, tenders, sources) is still
  hand-authored sample content — not synced from Notion — and several
  lines' real OSM identity (name, endpoints) differs from what the original
  fictional sample assumed; where that happened the `name`/`endStations`
  were corrected to match reality (see the per-line comments in
  `lines.ts`), but history narratives were only touched where they
  specifically contradicted the correction. The region border in
  `src/data/regionBorder.ts` is a rough hand-drawn outline, not an official
  boundary.
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
4. **Keep expanding line coverage.** The app now has 21 real lines running
   through Dolnośląskie (10 original + 9 passenger lines added in a second
   pass: 271, 276, 286, 309, 322, 326, 340, 283, 284 + 132 Bytom–Wrocław and
   143 Wrocław Mikołajów–Namysłów in a third pass, plus 289 and 317
   replacing the last two fictional entries). A further batch (272, 281,
   308, 299, 266, 336, plus the very long 14 Łódź Kaliska–Tuplice, likely
   impractically slow to fetch — 500+ way members) is still pending, having
   been interrupted by the public Overpass API rate-limiting/temporarily
   blocking this environment when two fetches ran concurrently — resume
   with the same fetch/stitch/clip pipeline, one line at a time. Querying
   OSM for every `route=railway` relation touching the region returns ~175
   relations; after excluding foreign (Czech/German) lines, cross-border
   stub duplicates, and intra-yard/depot micro-segments (dozens of very
   short technical connectors inside Wrocław/Legnica/Węgliniec yards), a
   realistic estimate is **~25-45 further genuine lines** still missing —
   mostly freight-only and closed/disused lines, since the passenger lines
   and major mainlines were prioritized first. When reconstructing any of
   these, watch for the duplicate-parallel-track and wrong-orientation
   stitching bugs described above (137/271/286/132 all had one) — check for
   OSM relations that pass near the same real station more than once before
   trusting the automatic longest-chain heuristic.
