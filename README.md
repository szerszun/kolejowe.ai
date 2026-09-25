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

- Interactive map of 19 lines across Lower Silesia, most with **real
  OpenStreetMap-derived alignments** (see Data below), each with its own
  distinguishable colour (20-colour palette, no yellow — it disappears
  against the basemap); status (active passenger / freight only / planned /
  closed) is conveyed by line style (solid / dashed / dotted) plus a legend,
  with hover tooltips, click-to-select + zoom-to-fit, and open-tender badges
- Deep-linkable line selection (`/line/274`) and station selection
  (`/station/<id>`) via the URL — clicking a station on the map, or a station
  name inside a line's Overview tab, opens a dedicated station panel listing
  which lines serve it (station-level data beyond that is a placeholder for now)
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

- **Line geometry**: `src/data/geometry/*.json` holds real alignments for 17 of
  the 19 lines (274, 275, 137, 273, 285, 292, 316, 311, 271, 276, 286, 309,
  322, 326, 340, 283, 284), stitched from OpenStreetMap `route=railway`
  relations (© OpenStreetMap contributors, ODbL) and clipped to Lower
  Silesia — see the comments at the top of `src/data/lines.ts` for how, and
  its caveats (137 is only a partial ~39km in-region fragment because that
  OSM relation is too fragmented to reassemble fully; 271 is a best-effort
  reconstruction stitched from several separate in-region fragments of a
  line that mostly runs through Wielkopolskie; 286 originally had a serious
  stitching bug — the raw OSM relation encodes several sections as duplicate
  parallel/alternate-track chains, and the original clip/merge step
  concatenated two of them back-to-back, producing a geometry that did a
  U-turn partway to Wałbrzych and dropped every station past Nowa Ruda. It
  was manually re-stitched by picking one consistent chain through each
  duplicated section (confirmed against real station positions, including
  Ludwikowice Kłodzkie, Głuszyca and Jedlina-Zdrój, which the buggy version
  was missing entirely); a couple of short real gaps in the OSM way data are
  bridged with straight segments, visible as small kinks rather than a
  U-turn; lines that continue beyond the region,
  like 273, 275 and 271, are simply cut off at the border). **Lines 293 and
  321 could not be matched to real Dolnośląskie OSM data** (293's ref number
  belongs to an unrelated line entirely in Opolskie; 321's only OSM match
  was an unrelated disused way near Nysa) and still use hand-drawn
  straight-line sample geometry. The 17 lines with real geometry also have
  real intermediate stations now — matched by proximity to each line's path
  from a region-wide query of OSM `railway=station`/`halt` nodes (plus
  `construction:railway`/`disused:railway` for stations mid-renovation on
  newly reactivated lines, e.g. Złotoryja on 284), using each station's real
  OSM node id as a canonical id shared across lines (so a station served by
  several lines, e.g. Wrocław Główny, correctly lists all of them instead of
  just one). Lines 293 and 321 still only have their two fictional endpoint
  stations. All other data (history, tenders, sources)
  is still hand-authored sample content —
  not synced from Notion — and several lines' real OSM identity (name,
  endpoints) differs from what the original fictional sample assumed; where
  that happened the `name`/`endStations` were corrected to match reality
  (see the per-line comments in `lines.ts`), but history narratives were only
  touched where they specifically contradicted the correction. The region
  border in `src/data/regionBorder.ts` is a rough hand-drawn outline, not an
  official boundary.
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
4. Track down the correct real OSM refs (or another source) for lines 293
   and 321
5. **Keep expanding line coverage.** The app now has 19 of the real lines
   that run through Dolnośląskie (10 original + 9 passenger lines added in
   a second pass: 271, 276, 286, 309, 322, 326, 340, 283, 284). Querying OSM
   for every `route=railway` relation touching the region returns ~175
   relations; after excluding foreign (Czech/German) lines, cross-border
   stub duplicates, and intra-yard/depot micro-segments (dozens of very
   short technical connectors inside Wrocław/Legnica/Węgliniec yards), a
   realistic estimate is **~30-60 further genuine lines** still missing —
   mostly freight-only and closed/disused lines, since the passenger lines
   were prioritized first. The same fetch/stitch/clip pipeline applies per
   line; the public Overpass API is slow/rate-limited, so budget real time
   for each additional batch.
