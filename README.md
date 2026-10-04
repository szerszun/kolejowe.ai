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

- Interactive map of 44 lines across Lower Silesia, most with **real
  OpenStreetMap-derived alignments** (see Data below), each with its own
  distinguishable colour (45-colour palette, no yellow — it disappears
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
  stations directly), shown as separate Lines/Stations result sections
  (lines sorted ascending by line number, stations sorted alphabetically)
  with a train-station icon for station results, plus status / electrified
  / has open tenders filters (status chips start unselected — showing
  everything — and narrow the map to the union of whichever chips are
  clicked, rather than starting all-selected and excluding on click) —
  also usable as a fully keyboard/screen-reader accessible list, not just
  via the map
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
  alignments (© OpenStreetMap contributors, ODbL) for **all 44 lines** — the
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
4. **Keep expanding line coverage.** The app now has 44 real lines running
   through Dolnośląskie (10 original + 9 passenger lines added in a second
   pass: 271, 276, 286, 309, 322, 326, 340, 283, 284 + 132 Bytom–Wrocław and
   143 Wrocław Mikołajów–Namysłów in a third pass, plus 289 and 317
   replacing the last two fictional entries, plus 281 Oleśnica–Chojnice,
   308 Jelenia Góra–Mysłakowice, 299 Kamienna Góra–Lubawka, 266 Świdnica
   Kraszowice–Jedlina Zdrój and 298 Kamienna Góra–Sędzisław — the real
   (and only) link between 299 and the rest of the network at Sędzisław on
   line 274 — in a fourth pass, plus all 16 short freight-only connector
   lines of the Wrocław rail node's "Obwodnica Towarowa" (750-765) in a
   fifth pass). Line 276 additionally got a second geometry fix: it was
   missing its entire southern half (Kłodzko down through Bystrzyca
   Kłodzka and Międzylesie to the Czech border) because the automatic
   picker never combined that raw chain with the Kłodzko–Wrocław one it
   did use; it's now stitched in along with the short official
   cross-border connector **481** (Lichkov – granica państwa), so 276's
   geometry runs all the way into the Czech Republic even though the
   line itself officially ends at Międzylesie — and the short connector
   to line 481 is now the exact real OSM track (it turned out to meet
   481 at the same coordinate with zero gap; an earlier pass had bridged
   it with an approximate ~4.7km straight line instead). Line 308 was
   also missing its own named endpoint station, Pisarzowice — added
   using the real (now-abandoned) halt node; the Pisarzowice–Kamienna
   Góra continuation some maps show is fully disused/dismantled track,
   so there's no live connection to line 299 to draw. **A systematic
   re-check after the 276 discovery** (comparing each line's own start
   point to its farthest point and to its own endpoint) turned up 8 more
   instances of the same duplicate/there-and-back bug that earlier
   spot-checks had missed: 752, 754, 758, 759, 761, 763 and 765 (all in
   the Wrocław freight bypass) plus 276 itself. **A second, more
   thorough re-check** then found the first pass had not fully fixed
   752, 758, 760, 763 and 764, plus newly-introduced regressions in 750
   and 755 — all 16 Wrocław freight lines (750-765) were rebuilt from
   raw OSM way members with a stronger pipeline: pairwise duplicate-
   segment detection, greedy stitching that also minimizes total jump
   distance when several equally-valid stitch orders exist (this alone
   fixed 760's visible gap near Wrocław Gądów, where the stitcher was
   wandering into a dead-end spur before continuing), and a self-revisit
   loop scanner that catches out-and-back detours pairwise comparison
   misses. 752/758/763/764 additionally needed a relaxed distance
   threshold or manual segment exclusion for duplicates spanning a
   *combined group* of several shorter ways, which simple pairwise
   comparison doesn't catch. Separately, lines 751/752/753/759/760 all
   officially terminate at "Wrocław Gądów" but their real OSM endpoints
   landed in different corners of that freight yard, up to ~1km apart —
   each was extended with a short connector to the yard's own OSM node
   (railway=yard, "Wrocław Gądów") so they visibly meet at one point.
   Several candidates were deliberately skipped: **272**
   Kluczbork–Poznań turned out to barely graze Dolnośląskie at all (<0.1%
   of its path is in-region — it's really an Opolskie/Wielkopolskie line),
   **336** Mirsk–Świeradów-Zdrój is ~67% physically identical to the
   Mirsk–Świeradów-Zdrój tail of line 317 already in the app (same real
   trackage, a different PKP line number) — adding it would just draw a
   near-duplicate on the map. The very long **14** Łódź Kaliska–Tuplice
   (500+ way members) remains unfetched, likely impractically slow via the
   public Overpass API. Querying OSM for every `route=railway` relation
   touching the region returns ~175 relations; after excluding foreign
   (Czech/German) lines, cross-border stub duplicates, near-duplicate
   trackage like 336, and the now-covered Wrocław yard connectors, a
   realistic estimate is **~5-25 further genuine lines** still missing —
   mostly freight-only and closed/disused lines further from Wrocław,
   since the passenger lines, major mainlines and the Wrocław node itself
   were prioritized first. When reconstructing any of these, watch for the
   duplicate-parallel-track and wrong-orientation stitching bugs described
   above (137/271/286/132/289/298/756/757/764 all had one) — check for OSM
   relations that pass near the same real station more than once, that
   loop back most of the way to their own start (298's bug), or that leave
   an adjacent zero-gap fragment unmerged (289's bug), before trusting the
   automatic longest-chain heuristic. The public Overpass API is also
   prone to long stretches of slow/timing-out responses (not just the hard
   rate-limit block from earlier) — expect a single line's fetch to
   occasionally take 10+ minutes even when it eventually succeeds.
5. Two more user-requested lines were since added: **282** Miłkowice–Żary
   (via Chojnów, Bolesławiec and Węgliniec — its official route relation was
   missing its own eastern Miłkowice–Chojnów–Bolesławiec extension despite
   matching `ref=282`-tagged ways existing in OSM; rebuilt by combining the
   relation's members with every `ref=282` way in the corridor and
   re-running the dedup/stitch pipeline, which also dropped two duplicate
   parallel-track branches near the Węgliniec junction; doesn't reach the
   German border itself — ends at Żary, ~20km short, since the actual
   border crossing there is already covered by line 274 via a different
   route) and **277** Wrocław Brochów–Opole Groszowice (via Siechnice,
   Jełcz-Laskowice and Karłowice — confirmed by real station coordinates
   against the candidate ref 292, which turns out to be a different,
   already-mapped line nowhere near Siechnice; geometry is cut at the
   region border toward Opole and falls ~2.5km short of Wrocław Brochów
   itself where the source OSM tagging ends).
