import { describe, expect, it } from "vitest";
import { getAllStations } from "./stations";
import type { RailwayLine, Station } from "../types";

function line(id: string, stations: Station[]): RailwayLine {
  return {
    id,
    number: id,
    name: `Line ${id}`,
    status: "active_passenger",
    electrified: true,
    lengthKm: 10,
    tracks: 1,
    maxSpeedKmh: 100,
    operators: [],
    passengerServices: [],
    endStations: [stations[0]?.name ?? "A", stations.at(-1)?.name ?? "B"],
    stations,
    geometry: [],
    history: { timeline: [], narrative: "", photos: [] },
    tenders: [],
    sources: [],
  };
}

function station(id: string, name = id): Station {
  return { id, name, coordinates: [0, 0] };
}

describe("getAllStations", () => {
  it("returns an empty list for no lines", () => {
    expect(getAllStations([])).toEqual([]);
  });

  it("lists each station once, tagged with the line that serves it", () => {
    const result = getAllStations([line("274", [station("a"), station("b")])]);
    expect(result).toEqual([
      { id: "a", name: "a", coordinates: [0, 0], lineIds: ["274"] },
      { id: "b", name: "b", coordinates: [0, 0], lineIds: ["274"] },
    ]);
  });

  it("regression: a station shared by multiple lines lists every line that serves it, not just one", () => {
    const shared = station("jelenia-gora-zachodnia", "Jelenia Góra Zachodnia");
    const result = getAllStations([line("274", [shared]), line("311", [shared, station("other")])]);

    const sharedEntry = result.find((s) => s.id === shared.id);
    expect(sharedEntry?.lineIds).toEqual(["274", "311"]);
    expect(result).toHaveLength(2); // the shared station still appears once, not twice
  });
});
