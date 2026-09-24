import type { RailwayLine, Station } from "../types";

export interface StationEntry extends Station {
  lineIds: string[];
}

export function getAllStations(lines: RailwayLine[]): StationEntry[] {
  const byId = new Map<string, StationEntry>();
  for (const line of lines) {
    for (const station of line.stations) {
      const existing = byId.get(station.id);
      if (existing) {
        existing.lineIds.push(line.id);
      } else {
        byId.set(station.id, { ...station, lineIds: [line.id] });
      }
    }
  }
  return Array.from(byId.values());
}
