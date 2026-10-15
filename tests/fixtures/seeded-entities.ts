/**
 * Stable, known-good anchors into the local seeded dataset (backend/kolejowe.db).
 * Picked because they're unlikely to be removed/renamed in normal content edits --
 * if one of these ever needs to change, it's a deliberate edit here, not a mystery
 * test failure.
 */
export const SEEDED = {
  /** A line with a full overview/history/tenders dataset, used as the generic "does the line panel work" anchor. */
  line274: { id: "274", number: "274", name: "Wrocław Świebodzki – Zgorzelec" },

  /** A line with zero tenders rows -- anchors the Tenders tab's empty state. */
  lineWithNoTenders: { id: "273", number: "273" },

  /** A busy, PLK-matched station -- anchors the live-feed-available path. */
  wroclawGlowny: { id: "osm-155479759", name: "Wrocław Główny", plkStationId: 60103 },

  /** A station with no PKP PLK match -- anchors the "not_matched" fallback path. */
  unmatchedStation: { id: "osm-9218764912", name: "Nowa Wieś Legnicka" },

  /** A station whose tracks are shared by more than one line -- anchors the
   * shared-track regression (the Overview tab must list every serving line, not just one). */
  sharedTrackStation: {
    id: "osm-1038540783",
    name: "Jelenia Góra Zachodnia",
    servingLineNumbers: ["274", "311"],
  },

  /** Typing the diacritics-free "Wroclaw" must still match "Wrocław ..." stations --
   * regression for the ł-has-no-NFD-decomposition bug. There are 30+ Wrocław-prefixed
   * stations in the seeded dataset, so this isn't sensitive to any one station existing. */
  diacriticsSearch: { query: "Wroclaw", expectedNamePrefix: "Wrocław" },
} as const;
