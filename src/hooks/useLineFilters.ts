import { useMemo, useState } from "react";
import type { LineStatus, RailwayLine } from "../types";
import { getAllStations, type StationEntry } from "../utils/stations";
import { normalize } from "../utils/text";

export interface FilterState {
  statuses: Set<LineStatus>;
  electrifiedOnly: boolean;
  hasTendersOnly: boolean;
}

// An empty status set means "no status filter active" (show every status);
// selecting one or more status chips narrows the map to lines matching any
// of them, rather than starting from everything selected and deselecting.
export function defaultFilterState(): FilterState {
  return { statuses: new Set(), electrifiedOnly: false, hasTendersOnly: false };
}

export function useLineFilters(lines: RailwayLine[]) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilterState());

  const q = normalize(query.trim());

  const statusFilteredLines = useMemo(
    () =>
      lines.filter((line) => {
        if (filters.statuses.size > 0 && !filters.statuses.has(line.status)) return false;
        if (filters.electrifiedOnly && !line.electrified) return false;
        if (filters.hasTendersOnly && !line.tenders.some((t) => t.status === "open")) return false;
        return true;
      }),
    [lines, filters],
  );

  // Sidebar "Lines" section: matches by the line's own identity (number,
  // name, end stations) -- not by an intermediate station name, so a line
  // search doesn't get cluttered with every line that merely passes near a
  // matching town (that's what the separate "Stations" section is for).
  const filteredLines = useMemo(() => {
    if (!q) return statusFilteredLines;
    return statusFilteredLines.filter((line) =>
      [line.number, line.name, ...line.endStations].map(normalize).some((h) => h.includes(q)),
    );
  }, [statusFilteredLines, q]);

  const allStations = useMemo(() => getAllStations(lines), [lines]);

  // Only populated once the user starts typing -- an unfiltered list of
  // every station would just be noise.
  const filteredStations = useMemo((): StationEntry[] => {
    if (!q) return [];
    return allStations.filter((s) => normalize(s.name).includes(q));
  }, [allStations, q]);

  // Map visibility: a line stays on the map if it matches by its own
  // identity, or if one of its stations matches -- so searching a station
  // still highlights the lines that serve it.
  const visibleLineIds = useMemo(() => {
    if (!q) return new Set(statusFilteredLines.map((l) => l.id));
    const statusFilteredIds = new Set(statusFilteredLines.map((l) => l.id));
    const ids = new Set(filteredLines.map((l) => l.id));
    for (const station of filteredStations) {
      for (const lineId of station.lineIds) {
        if (statusFilteredIds.has(lineId)) ids.add(lineId);
      }
    }
    return ids;
  }, [statusFilteredLines, filteredLines, filteredStations, q]);

  return { query, setQuery, filters, setFilters, filteredLines, filteredStations, visibleLineIds };
}
