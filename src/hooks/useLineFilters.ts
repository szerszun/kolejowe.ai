import { useMemo, useState } from "react";
import type { LineStatus, RailwayLine } from "../types";
import { ALL_STATUSES } from "../utils/status";

export interface FilterState {
  statuses: Set<LineStatus>;
  electrifiedOnly: boolean;
  hasTendersOnly: boolean;
}

export function defaultFilterState(): FilterState {
  return { statuses: new Set(ALL_STATUSES), electrifiedOnly: false, hasTendersOnly: false };
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function useLineFilters(lines: RailwayLine[]) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilterState());

  const filteredLines = useMemo(() => {
    const q = normalize(query.trim());
    return lines.filter((line) => {
      if (!filters.statuses.has(line.status)) return false;
      if (filters.electrifiedOnly && !line.electrified) return false;
      if (filters.hasTendersOnly && !line.tenders.some((t) => t.status === "open")) return false;
      if (!q) return true;
      const haystacks = [
        line.number,
        line.name,
        ...line.endStations,
        ...line.stations.map((s) => s.name),
      ].map(normalize);
      return haystacks.some((h) => h.includes(q));
    });
  }, [lines, query, filters]);

  const visibleLineIds = useMemo(() => new Set(filteredLines.map((l) => l.id)), [filteredLines]);

  return { query, setQuery, filters, setFilters, filteredLines, visibleLineIds };
}
