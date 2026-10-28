import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlkScheduleRoute } from "../lib/plkApi";
import type { PlkMatchedStation } from "./payloadClient";

const { fetchDataVersion, fetchSchedulesForStations } = vi.hoisted(() => ({
  fetchDataVersion: vi.fn(),
  fetchSchedulesForStations: vi.fn(),
}));
vi.mock("../lib/plkApi", () => ({ fetchDataVersion, fetchSchedulesForStations }));

const { getStation, getTimetableInfo, listPlkMatchedStations, patchStation, patchTimetableInfo } = vi.hoisted(() => ({
  getStation: vi.fn(),
  getTimetableInfo: vi.fn(),
  listPlkMatchedStations: vi.fn(),
  patchStation: vi.fn(),
  patchTimetableInfo: vi.fn(),
}));
vi.mock("./payloadClient", () => ({ getStation, getTimetableInfo, listPlkMatchedStations, patchStation, patchTimetableInfo }));

const { syncTimetables, trainNumberAliases } = await import("./syncTimetables");

const NEW_VERSION = "new-version-guid";
const OLD_VERSION = "old-version-guid";

function station(overrides: Partial<PlkMatchedStation> = {}): PlkMatchedStation {
  return {
    id: "osm-1",
    plkStationId: 100,
    timetable: [],
    arrivals: [],
    ...overrides,
  };
}

function route(
  stationId: number,
  overrides: Partial<PlkScheduleRoute["stations"][number]> = {},
  operatingDates: string[] = ["2026-10-19"],
): PlkScheduleRoute {
  return {
    scheduleId: 1,
    orderId: 1,
    trainOrderId: 1,
    operatingDates,
    stations: [{ stationId, orderNumber: 1, ...overrides }],
  };
}

beforeEach(() => {
  fetchDataVersion.mockReset();
  fetchSchedulesForStations.mockReset();
  getStation.mockReset();
  getTimetableInfo.mockReset();
  listPlkMatchedStations.mockReset();
  patchStation.mockReset().mockResolvedValue({ doc: {} });
  patchTimetableInfo.mockReset().mockResolvedValue({});
});

describe("syncTimetables", () => {
  it("does nothing when PLK's schedulesVersion is unchanged since the last run", async () => {
    getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
    fetchDataVersion.mockResolvedValue({ schedulesVersion: OLD_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });

    const result = await syncTimetables();

    expect(result).toEqual({ outcome: "unchanged" });
    expect(listPlkMatchedStations).not.toHaveBeenCalled();
    expect(patchStation).not.toHaveBeenCalled();
    expect(patchTimetableInfo).not.toHaveBeenCalled();
  });

  it("updates an entry's time and platform when they differ from PLK's schedule, leaving everything else untouched", async () => {
    getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
    fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
    const matched = station({
      timetable: [{ id: "e1", time: "08:00", trainNumber: "12345", platform: "1" }],
    });
    listPlkMatchedStations.mockResolvedValue([matched]);
    fetchSchedulesForStations.mockResolvedValue([
      route(100, { departureTrainNumber: "12345", departureTime: "08:15:00", departurePlatform: "2" }),
    ]);

    const result = await syncTimetables();

    expect(result.outcome).toBe("synced");
    if (result.outcome !== "synced") throw new Error("unreachable");
    expect(result.updates).toEqual([
      { stationId: "osm-1", kind: "departure", trainNumber: "12345", field: "time", from: "08:00", to: "08:15" },
      { stationId: "osm-1", kind: "departure", trainNumber: "12345", field: "platform", from: "1", to: "2" },
    ]);
    expect(patchStation).toHaveBeenCalledTimes(1);
    expect(patchStation).toHaveBeenCalledWith("osm-1", {
      timetable: [{ id: "e1", time: "08:15", trainNumber: "12345", platform: "2" }],
      arrivals: [],
    });
    expect(patchTimetableInfo).toHaveBeenCalledWith({ plkSchedulesVersion: NEW_VERSION });
  });

  it("does not patch a station whose entries already match PLK's schedule exactly", async () => {
    getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
    fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
    listPlkMatchedStations.mockResolvedValue([
      station({ timetable: [{ id: "e1", time: "08:00", trainNumber: "12345", platform: "1" }] }),
    ]);
    fetchSchedulesForStations.mockResolvedValue([
      route(100, { departureTrainNumber: "12345", departureTime: "08:00:00", departurePlatform: "1" }),
    ]);

    const result = await syncTimetables();

    expect(result.outcome).toBe("synced");
    if (result.outcome !== "synced") throw new Error("unreachable");
    expect(result.updates).toEqual([]);
    expect(patchStation).not.toHaveBeenCalled();
  });

  it("reports a PLK train with no matching entry, but never creates one", async () => {
    getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
    fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
    listPlkMatchedStations.mockResolvedValue([station({ timetable: [] })]);
    fetchSchedulesForStations.mockResolvedValue([
      route(100, { departureTrainNumber: "99999", departureTime: "09:00:00", departurePlatform: "3" }),
    ]);

    const result = await syncTimetables();

    expect(result.outcome).toBe("synced");
    if (result.outcome !== "synced") throw new Error("unreachable");
    expect(result.unmatchedPlkTrains).toEqual([{ stationPlkId: 100, trainNumber: "99999", kind: "departure" }]);
    expect(result.updates).toEqual([]);
    expect(patchStation).not.toHaveBeenCalled();
  });

  it("reports an existing entry missing from today's PLK schedule, but never removes it", async () => {
    getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
    fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
    listPlkMatchedStations.mockResolvedValue([
      station({ timetable: [{ id: "e1", time: "08:00", trainNumber: "12345", platform: "1" }] }),
    ]);
    fetchSchedulesForStations.mockResolvedValue([]); // nothing running today

    const result = await syncTimetables();

    expect(result.outcome).toBe("synced");
    if (result.outcome !== "synced") throw new Error("unreachable");
    expect(result.unmatchedEntries).toEqual([{ stationId: "osm-1", trainNumber: "12345", kind: "departure" }]);
    expect(patchStation).not.toHaveBeenCalled();
  });

  it("records a per-station error without aborting the rest of the sync", async () => {
    getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
    fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
    listPlkMatchedStations.mockResolvedValue([station()]);
    fetchSchedulesForStations.mockRejectedValue(new Error("PLK API down"));

    const result = await syncTimetables();

    expect(result.outcome).toBe("synced");
    if (result.outcome !== "synced") throw new Error("unreachable");
    expect(result.errors).toEqual([{ stationId: "osm-1", message: "PLK API down" }]);
    // Deliberately not saved: the sync only re-runs when the version differs, so saving
    // it here would leave this station out of date until PLK's next amendment. The next
    // run retries instead -- already-synced stations match and aren't rewritten.
    expect(result.versionSaved).toBe(false);
    expect(patchTimetableInfo).not.toHaveBeenCalled();
  });

  describe("a station write that fails", () => {
    const http = (status: number) => Object.assign(new Error(`PATCH /api/stations/osm-1 -> ${status}: x`), { status });

    beforeEach(() => {
      getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
      fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
      listPlkMatchedStations.mockResolvedValue([
        station({ timetable: [{ id: "e1", time: "08:00", trainNumber: "12345", platform: "1" }] }),
      ]);
      fetchSchedulesForStations.mockResolvedValue([
        route(100, { departureTrainNumber: "12345", departureTime: "08:15:00", departurePlatform: "1" }),
      ]);
    });

    it("regression: counts a 502 as saved when reading the station back shows the new data", async () => {
      // Seen on a real run: Render's proxy answered 502 while the backend still saved the
      // write, so a station already showing the new times was reported as an error.
      patchStation.mockRejectedValue(http(502));
      getStation.mockResolvedValue({ timetable: [{ id: "e1", time: "08:15", trainNumber: "12345", platform: "1" }], arrivals: [] });

      const result = await syncTimetables();

      if (result.outcome !== "synced") throw new Error("unreachable");
      expect(getStation).toHaveBeenCalledWith("osm-1");
      expect(result.errors).toEqual([]);
      expect(result.confirmedAfter5xx).toBe(1);
      expect(result.versionSaved).toBe(true);
      expect(patchTimetableInfo).toHaveBeenCalledWith({ plkSchedulesVersion: NEW_VERSION });
    });

    it("reports a 502 as an error (and keeps the version unsaved) when the read-back still has the old data", async () => {
      patchStation.mockRejectedValue(http(502));
      getStation.mockResolvedValue({ timetable: [{ id: "e1", time: "08:00", trainNumber: "12345", platform: "1" }], arrivals: [] });

      const result = await syncTimetables();

      if (result.outcome !== "synced") throw new Error("unreachable");
      expect(result.errors).toHaveLength(1);
      expect(result.confirmedAfter5xx).toBe(0);
      expect(patchTimetableInfo).not.toHaveBeenCalled();
    });

    it("reports a 502 as an error when the read-back itself fails", async () => {
      patchStation.mockRejectedValue(http(502));
      getStation.mockRejectedValue(new Error("GET /api/stations/osm-1 -> 502"));

      const result = await syncTimetables();

      if (result.outcome !== "synced") throw new Error("unreachable");
      expect(result.errors).toHaveLength(1);
    });

    it("doesn't read back after a 4xx -- that write definitely didn't land", async () => {
      patchStation.mockRejectedValue(http(403));

      const result = await syncTimetables();

      if (result.outcome !== "synced") throw new Error("unreachable");
      expect(getStation).not.toHaveBeenCalled();
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("the multi-day schedule window", () => {
    function isoDate(daysFromToday: number): string {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + daysFromToday);
      return d.toISOString().slice(0, 10);
    }
    const days = (...offsets: number[]) => offsets.map(isoDate);

    beforeEach(() => {
      getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
      fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
      listPlkMatchedStations.mockResolvedValue([station({ timetable: [{ id: "e1", time: "08:00", trainNumber: "12345" }] })]);
    });

    it("asks PLK for the next 7 days, not just today", async () => {
      fetchSchedulesForStations.mockResolvedValue([]);

      const result = await syncTimetables();

      expect(fetchSchedulesForStations).toHaveBeenCalledWith([100], isoDate(0), isoDate(6));
      if (result.outcome !== "synced") throw new Error("unreachable");
      expect(result.window).toEqual({ from: isoDate(0), to: isoDate(6) });
    });

    it("regression: matches a train that doesn't run today, instead of reporting it missing", async () => {
      fetchSchedulesForStations.mockResolvedValue([
        route(100, { departureTrainNumber: "12345", departureTime: "08:05:00" }, days(5, 6)),
      ]);

      const result = await syncTimetables();

      if (result.outcome !== "synced") throw new Error("unreachable");
      expect(result.unmatchedEntries).toEqual([]);
      expect(result.updates.map((u) => u.to)).toEqual(["08:05"]);
    });

    it("uses the time the train has on most days of the window, whichever order PLK lists the routes in", async () => {
      const weekend = route(100, { departureTrainNumber: "12345", departureTime: "09:30:00" }, days(5, 6));
      const weekday = route(100, { departureTrainNumber: "12345", departureTime: "08:10:00" }, days(0, 1, 2, 3, 4));

      for (const routes of [[weekend, weekday], [weekday, weekend]]) {
        fetchSchedulesForStations.mockResolvedValue(routes);
        const result = await syncTimetables();
        if (result.outcome !== "synced") throw new Error("unreachable");
        expect(result.updates.map((u) => u.to)).toEqual(["08:10"]);
      }
    });

    it("breaks a tie in running days by the earliest date", async () => {
      const later = route(100, { departureTrainNumber: "12345", departureTime: "09:30:00" }, days(3));
      const earlier = route(100, { departureTrainNumber: "12345", departureTime: "08:10:00" }, days(1));
      fetchSchedulesForStations.mockResolvedValue([later, earlier]);

      const result = await syncTimetables();

      if (result.outcome !== "synced") throw new Error("unreachable");
      expect(result.updates.map((u) => u.to)).toEqual(["08:10"]);
    });
  });

  it("regression: a slash-notation train number (e.g. \"17206/7\") matches PLK's single directional number", async () => {
    // Confirmed the hard way, running this end-to-end against the real PLK API: the
    // seed data's round-trip services ("17206/7" = 17206 one way, 17207 the other --
    // last digit(s) after the slash replace the same number of digits in the prefix)
    // never matched PLK's single-number-per-movement format before this fix, so a
    // real run matched ~0 of ~23,000 trains.
    getTimetableInfo.mockResolvedValue({ plkSchedulesVersion: OLD_VERSION });
    fetchDataVersion.mockResolvedValue({ schedulesVersion: NEW_VERSION, dataVersion: "x", operationsVersion: "y", timestamp: "now" });
    listPlkMatchedStations.mockResolvedValue([
      station({ timetable: [{ id: "e1", time: "08:00", trainNumber: "17206/7", platform: "1" }] }),
    ]);
    fetchSchedulesForStations.mockResolvedValue([
      route(100, { departureTrainNumber: "17207", departureTime: "08:05:00", departurePlatform: "1" }),
    ]);

    const result = await syncTimetables();

    expect(result.outcome).toBe("synced");
    if (result.outcome !== "synced") throw new Error("unreachable");
    expect(result.unmatchedEntries).toEqual([]);
    expect(result.updates).toEqual([
      { stationId: "osm-1", kind: "departure", trainNumber: "17206/7", field: "time", from: "08:00", to: "08:05" },
    ]);
  });
});

describe("trainNumberAliases", () => {
  it("returns the raw number unchanged when there's no slash", () => {
    expect(trainNumberAliases("66139")).toEqual(["66139"]);
  });

  it("splits a round-trip number, replacing the same number of trailing digits", () => {
    expect(trainNumberAliases("17206/7")).toEqual(["17206", "17207"]);
    expect(trainNumberAliases("6128/9")).toEqual(["6128", "6129"]);
    expect(trainNumberAliases("76108/9")).toEqual(["76108", "76109"]);
  });

  it("handles a multi-digit suffix", () => {
    expect(trainNumberAliases("12345/67")).toEqual(["12345", "12367"]);
  });
});
