# kolejowe.ai — Lower Silesia Railways Explorer

Interactive map + AI assistant for exploring railway lines in the Dolnośląskie
voivodeship. This repo currently contains the **v1 draft**: the map, details
panel and chat UX, backed by a real Payload CMS (`backend/`) seeded from a
hand-authored sample dataset, so the UX can be reviewed before the real
Notion sync and LLM integration are built.

See `kolejowe.ai v1 Technical Specification.pdf` (project owner's copy) for
the full requirements this UI is tracking.

## Stack

- React 19 + TypeScript + Vite
- MapLibre GL JS, tiles from [OpenFreeMap](https://openfreemap.org/) (no usage billing)
- react-router-dom for `/line/:number` deep links
- `backend/` — Payload CMS, the real source of truth for line/station data
  (see `backend/README.md`); the frontend fetches from its REST API
  (`src/lib/payloadClient.ts` / `src/hooks/useLines.ts` /
  `src/hooks/useStationDetails.ts`) instead of a static import. Chat answers
  still come from a keyword-matching mock in `src/components/Chat/mockAssistant.ts`.

## Running it

Needs both the frontend and the backend running:

```bash
# terminal 1 -- backend (first time: npm install && cp .env.example .env && npm run seed)
cd backend && npm run dev

# terminal 2 -- frontend
npm install
npm run dev
```

The frontend shows a loading/error state if it can't reach the backend at
`http://localhost:3000` (configurable via `VITE_PAYLOAD_URL`) — see
`backend/README.md` for first-time setup (seeding, the agent job, etc.).

## Testing

A regression suite covers the map, line/station details, the live PKP PLK
feed (mocked — never calls the real rate-limited API), access control, and
a handful of fixtures tied to specific bugs this project hit before. Run it
with the backend already seeded and **not** already running on :3000/:5173
(Playwright starts both itself):

```bash
npm test
```

This runs Vitest (pure-logic unit tests), the full Playwright suite (E2E +
API + a real production-build smoke test), and writes an executive-readable
go/no-go report to `test-results/executive-summary.html` — open it in a
browser; `npm test`'s own exit code reflects its verdict (non-zero if any
`[CRITICAL]`-tagged test failed). `npm run test:unit` / `npm run test:e2e`
run either half alone; `npm run test:report` just regenerates the summary
from the last run's results. See `tests/report/generate-report.mjs` for
exactly how severity and the verdict are computed, and
`.github/workflows/regression.yml` for the CI job that runs this on every
push/PR to `main` and emails the admin the report after a push.

## What's implemented (draft scope)

- Interactive map of 86 lines across Lower Silesia, most with **real
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
  alignments (© OpenStreetMap contributors, ODbL) for **all 86 lines** — the
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
- **Backend**: `backend/` (Payload CMS) is real and the frontend reads from
  it, but it's seeded from the same hand-authored sample data, not a real
  Notion sync -- no pgvector, no overnight Notion sync job, no
  tender-to-line auto-matching pipeline. Its scheduled agent job only
  keeps line *geometry* fresh against OSM; station details/tenders/sources
  are still static seed content.
- Line 275's "manually curated" flag is just a UI badge here — the real
  dedicated-Notion-structure workflow doesn't exist yet.

## Not built at all yet (mostly "Could" in the spec)

- Station markers below zoom 10 tuning / elevation profile
- Full offline/PWA or mobile app packaging (out of scope for v1 anyway)
- Cookie-less analytics, GDPR-compliant chat log retention (needs a backend)
- WCAG 2.1 AA audit — semantics and keyboard paths are in place, but this
  hasn't been formally tested against the standard

## Suggested next steps

**Update:** the backend direction below (FastAPI + PostgreSQL + a Notion
sync job) has been superseded by `backend/` -- a Payload CMS instance with
`stations`/`lines` collections, draft/publish versioning, and a scheduled
agent job that re-fetches geometry from OSM and writes drafts for a human
to review. See `backend/README.md`. The frontend now reads from it live
(see "Running it" above) instead of the static `src/data/lines.ts` import.

1. ~~Stand up the FastAPI + PostgreSQL/PostGIS backend~~ -- see `backend/`
   instead. ~~Point the frontend at it~~ -- done.
2. ~~Wire the Notion sync job~~ -- superseded by `backend/`'s agent job
   (currently geometry-only; station details/tenders/sources are still
   seeded from the static files, not kept in sync with anything external).
3. Replace `mockAssistant.ts` with real retrieval (pgvector) + an LLM call
   behind the backend (key never in the frontend)
4. **Keep expanding line coverage.** The app now has 45 real lines running
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
6. A sixth pass added eight more lines (**318** Bielawa Zachodnia–Srebrna
   Góra, **319** Strzelin–Łagiewniki, **341** Dzierżoniów Śląski–Bielawa
   Zachodnia, **786** Granica Państwa (Trzciniec Zgorzelecki)–Bogatynia,
   **345** Kamienna Góra–Pisarzowice, **302** Malczyce–Marciszów, **337**
   Lubań Śląski–Leśna and **349** Święta Katarzyna–Wrocław Kuźniki), plus a
   correction to the existing **322**: fetching a candidate "D92" turned out
   to be line 322 under a different working label (the *relation's* own
   `ref` tag said "D92", but every individual way member was tagged
   `ref=322`) — checking way-level refs against the relation ref like this
   is now standard practice before trusting any fetch as genuinely new.
   322 itself was missing its entire northern ~7km and had a fictional
   endpoint name ("Kłodzko Nowe"); fixed to the real endpoint **Kłodzko
   Główne**, with 2 real stations added. 318/319/341 are a small
   DSDiK-run passenger cluster around Dzierżoniów/Bielawa (341 and 318
   share the Bielawa Zachodnia endpoint); finding their stations required
   broadening the Overpass station query from `railway~"^(station|halt)$"`
   to any named `railway=*`-tagged node, since several real via-stations
   on these lines are tagged `disused:`/`construction:railway=halt` rather
   than a plain `halt`. **786** serves the Turów lignite mine/power plant
   via the German border crossing at Trzciniec Zgorzelecki — freight-only
   despite a nominal passenger stop at Bogatynia, with its final ~2km into
   town disused. **345** and **302** are both effectively **closed**:
   345 is a short Kamienna Góra branch, disused except for a short
   connecting spur; 302 is a 74km former passenger line to Marciszów,
   passenger service ended in 1996 and all traffic was suspended in 2014,
   though DSDiK took over its southern half in Dec. 2022 (a possible
   future tourist reactivation) — both statuses, plus 337's 2008
   freight reactivation for basalt quarry traffic, were confirmed via a
   live web lookup rather than inferred from OSM tags alone. **349** is a
   double-track electrified segment of the Wrocław freight ring (same
   family as 750–765) whose raw OSM geometry had a genuine duplicate
   "there and back" artifact near the Wrocław Kuźniki end that the
   automatic pairwise dedup missed — caught by the self-revisit loop
   scanner (a 3km loop with endpoints only ~90m apart, well outside the
   normal ~90-100m curvature-noise range every other candidate in this
   pass also triggered) and confirmed with a zoomed before/after plot.
7. A seventh pass worked through the full medium-tier shortlist (14
   lines): **290** Mikułowa–Granica Państwa (Krzewina Zgorzelecka),
   **296** Wielkie Piekary–Miłkowice, **303** Rokitki–Niegosławice,
   **310** Kobierzyce–Piława Górna, **324** Ręczyn–Granica Państwa
   (Hagenwerder), **327** Wolibórz–Radków, **331** Jawor–Roztoka,
   **334** Kamieniec Ząbkowicki–Złoty Stok, **335** Henryków–Ciepłowody,
   **344** Wilka–Zawidów, **766** Łukanów–Dąbrowa Oleśnicka, **771**
   Świdnica Przedmieście–Świdnica Miasto, **772** Strzegom
   Międzyrzecze–Strzegom Miasto, and **973** Bolesławiec–Wizów (bumping
   the total from 53 to 67). Several form small real-world clusters
   with lines already in the app: 290, 324 and 786 are three separate
   German border crossings within a few km of each other, all part of
   the old Görlitz–Zittau corridor (Neißetalbahn); 331 branches off 302
   at the exact same Roztoka junction node (confirmed by matching OSM
   id), both taken over by DSDiK on the Strzegom–Marciszów section in
   Dec. 2022; 772 is a short abandoned spur into the same Strzegom
   Miasto station that 302 already documents; 766 crosses both 143 and
   281. Status was mostly settled by a live web lookup rather than OSM
   tags alone, since several of these lines are only *partially* active
   and the split matters: 296 and 349-style "whole route re-tagged
   construction/disused" cases don't arise here, but 303 (only
   Rokitki–Chocianów reactivated by DSDiK/Koleje Dolnośląskie in Dec.
   2022, rest closed), 310 (DSDiK rebuilding the Łagiewniki
   Dzierżoniowskie–Piława Górna section toward a 2024 target, not yet
   confirmed reopened), 327 and 331 (each has one genuinely active
   freight stub plus a closed remainder) all needed the nuance spelled
   out in their narratives rather than a single blanket status. 334 and
   335 both carry an explicit OSM `note` that they were formally struck
   off the PKP PLK infrastructure register. **296 surfaced a new
   geometry bug distinct from the parallel-track duplication seen
   before**: the self-revisit loop scanner found an 89-point,
   4.9km-path loop anchored at the chain's own start point (endpoints
   only 54m apart) — a dead-end balloon/spur at the Wielkie Piekary
   junction, not a second digitized copy of the same track. Trimming it
   with the usual apex-based start-loop fix was *wrong*: it kept the
   long "out" leg as if it were the real route and replaced the "back"
   leg with a straight-line jump across a genuine 2.4km gap where no
   track exists, barely changing the total length (17.0km → 16.96km,
   when the true fix should cut much more). The correct fix for a
   dead-end loop is to collapse the *entire* span to a single point
   (keep only the chain's own start, then resume immediately after the
   loop closes) — verified here by cross-checking against the line's
   official 12.685km length, which the wrong fix was nowhere near and
   the right one landed within 4% of (after a second, smaller dead-end
   spur further along got the same treatment). **303** additionally
   needed a cross-relation stitch: PKP line 303 is split across two
   separate OSM route relations (Rokitki–Przemków via Chocianów, and a
   separately-tagged Chocianów–Niegosławice continuation) that connect
   at an exact zero-gap coordinate match — fetched individually by
   relation id (`fetch_line.py` only picks the first ref match when
   several relations share a ref) and combined into one 39.33km
   geometry. No candidates were skipped in this pass; all 14 researched
   refs turned out to be genuine, distinct lines.
8. An eighth pass went looking for whatever remained beyond the first
   two shortlists: a broad, unfiltered Overpass query for every
   `route=railway` relation touching a generous bounding box (453
   relations — most in Upper Silesia, Czechia, Greater Poland and
   elsewhere, filtered down by name/geography to Lower Silesia
   candidates) turned up 15 more refs genuinely in-region and not yet
   covered. 14 became real additions — **778** Zgorzelec R1–R11,
   **779** Studniska–Las, **974** Rakowice Żwirownia–Rakowice ZKGM
   (near existing line 973), **749** Legnica Wschód–Legnica, **773**
   Boguszów-Gorce–Boguszów-Gorce Towarowy, **976** Boguszów Gorce
   Zachód–Czarny Bór, **869** Wałbrzych Szczawienko–Wałbrzych Zespół
   Bocznic, **774** Krużyn–Marciszów Górny (closed since 2004), **776**
   Marciszów–Wojcieszów Górny (reopened 2008 for quarry freight, same
   pattern as line 337), **970** Mietków–Mietków Bocznica Majkoltrans,
   **971** Lubin–Rudna Główna and **972** Pawłowice Małe–Pawłowice Małe
   Fabryczny (both KGHM copper-belt siblings of existing line 289,
   serving the Lubin mine and the Legnica smelter respectively), **975**
   Węgliniec SKP–Węgliniec Wg, and **181** Oleśnica–Syców — bringing the
   total from 67 to 81. Several form clusters with lines already in the
   app: 778/779 sit in the same Zgorzelec border complex as 786/290/324;
   773/976/869 are three separate Wałbrzych-area freight spurs; 774/776
   are two unrelated lines that happen to both touch "Marciszów" (774's
   endpoint, Marciszów Górny, is a distinct point from both 302's
   Marciszów and 776's own Marciszów start — all three are different
   named locations in the same small area); 971/972 extend the KGHM
   copper-mining network already represented by 289; 975 is internal
   yard trackage in the same Węgliniec hub referenced in 282's
   narrative. One candidate, **785** (Granica Państwa Trzciniec
   Zgorzelecki–Granica Państwa Krzewina Zgorzelecka), was fetched but
   turned out to be the same D92/322 mislabeling pattern one layer
   deeper: its relation tags said "785," but every way member was
   actually tagged with the *German* DB Netz reference "6589"
   (Neißetalbahn) — and its geometry sat exactly on top of where lines
   786 and 290 already meet, so it was correctly identified as already
   covered rather than added as a phantom duplicate. Line **774** hit a
   second, different kind of ref collision: OSM has *two* separate
   relations both tagged `ref=774` — this Polish Krużyn–Marciszów Górny
   line, and an unrelated Czech line (Mikulovice–Hanušovice);
   `fetch_line.py`'s bbox restriction picked the correct Polish one
   automatically, but it was confirmed explicitly before trusting the
   result. The trickiest case was **D71** (nominally "Oleśnica
   Rataje–Syców"): way-level ref tags showed its 21 members were
   actually split between two *different* real PKP lines, 281 (8 ways,
   already in the app) and 181 (13 ways, genuinely new) — the "D71"
   label was an OSM-only convenience grouping, not a real PKP line
   number. The 281-tagged ways were discarded as already covered; the
   181-tagged ways were extracted into their own synthetic raw-data
   file and processed normally, yielding the Oleśnica–Syców segment of
   the much longer (149km) Herby Nowe–Oleśnica line, reactivated in
   2016 and now mid-electrification (contract signed March 2024,
   targeting 2026 — explaining its mixed `construction`/`rail` way
   tags). Line **296** from the previous pass had already surfaced a
   "dead-end spur" geometry bug distinct from parallel-track
   duplication; no new instance of that specific bug turned up in this
   pass, but every candidate's self-revisit loops were checked against
   it (anchored-at-start, large loop_len relative to hop count) before
   being dismissed as normal curvature noise.
9. A final round went back through the full `survey_all.json` dump
   from pass 8 (453 relations) looking for any remaining genuine,
   in-region refs that hadn't been checked yet, by name-matching
   against Lower Silesian towns and cross-referencing against the now
   81 covered line numbers. Five more real additions came out of it —
   **278** Węgliniec–Zgorzelec, **291** Wałbrzych Szczawienko–
   Boguszów-Gorce Wschód, **348** Trzciniec Zgorzelecki–Granica Państwa
   (Zittau), **382** Pątnów Legnicki–Legnica, and **372** Bojanowo–Góra
   Śląska — bringing the total from 81 to 86. **278** turned out to be
   a genuinely significant find: a double-track, electrified mainline
   carrying Koleje Dolnośląskie, Polregio and PKP Intercity as part of
   the European E30 corridor (Görlitz–Mościska) — its raw OSM geometry
   had the expected double-track duplication (37 of 54 ways dropped as
   pairwise dups) plus two small local zigzags, one of which (~0.5km)
   was well outside the usual ~100m curvature-noise range and got the
   same zoomed-plot scrutiny as line 296's dead-end spur before being
   confirmed as a genuine small duplicate-track artifact and trimmed.
   **291** shares both of its endpoint towns (Wałbrzych Szczawienko,
   Boguszów-Gorce) with the already-covered industrial spurs 869 and
   976, but turned out to be a completely different, much longer
   (14.76km) scenic mountain route through Szczawno-Zdrój — confirmed
   distinct before adding, not a duplicate. **348** sits right next to
   the previously-skipped relation 785 (the mislabeled German "6589"
   stub) and shares its Trzciniec Zgorzelecki junction with line 786,
   but this time way-level ref tags confirmed it genuinely is PKP line
   348 — in fact 786 branches off from 348 at that junction. A sixth
   candidate, the unreffed **"Kolej Sowiogórska"** heritage-branded
   relation (Dzierżoniów Dworzec Mały–Radków), turned out to be pure
   overlap: its 76 way members split cleanly between two lines already
   in the app (327: 57 ways, 318: 16 ways), so it contributed nothing
   new and was skipped. Four more leads from the survey (288 Nysa–
   Brzeg, 301 Opole–Namysłów, 304 Brzeg–Małujowice, 370 Zielona Góra–
   Żary) were checked by bounding box and confirmed centered in
   Opolskie or Lubuskie, not Dolnośląskie, and skipped without
   fetching. With this round done, the realistic candidate list for
   the region appears largely exhausted — the remaining gaps are
   mostly very obscure industrial sidings or lines with no OSM
   route-relation coverage at all.
