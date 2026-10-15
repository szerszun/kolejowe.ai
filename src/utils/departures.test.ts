import { describe, expect, it } from "vitest";
import { applyLiveData, getUpcomingMovements } from "./departures";
import type { LiveMovement } from "../types";

interface FakeEntry {
  id: string;
  time: string;
  daysOfOperation: "daily" | "weekdays" | "weekend" | "other";
}

function entry(id: string, time: string, daysOfOperation: FakeEntry["daysOfOperation"] = "daily"): FakeEntry {
  return { id, time, daysOfOperation };
}

function liveMovement(overrides: Partial<LiveMovement> = {}): LiveMovement {
  return {
    scheduledArrival: null,
    scheduledDeparture: null,
    actualArrival: null,
    actualDeparture: null,
    arrivalDelayMinutes: null,
    departureDelayMinutes: null,
    cancelled: false,
    ...overrides,
  };
}

// A fixed Monday so day-of-week filtering is deterministic.
const MONDAY_09_00 = new Date(2026, 9, 12, 9, 0, 0);

describe("getUpcomingMovements", () => {
  it("only includes entries within the next hoursAhead window", () => {
    const timetable = [entry("too-soon-in-past", "08:59"), entry("in-range", "10:00"), entry("too-far", "16:00")];
    const result = getUpcomingMovements(timetable, MONDAY_09_00, 6);
    expect(result.map((m) => m.entry.id)).toEqual(["in-range"]);
  });

  it("sorts results chronologically", () => {
    const timetable = [entry("later", "14:00"), entry("earlier", "10:00")];
    const result = getUpcomingMovements(timetable, MONDAY_09_00, 6);
    expect(result.map((m) => m.entry.id)).toEqual(["earlier", "later"]);
  });

  it("[MAJOR] respects days-of-operation filtering (weekday-only service excluded on a weekend day)", () => {
    const saturday = new Date(2026, 9, 17, 9, 0, 0);
    const timetable = [entry("weekdays-only", "10:00", "weekdays"), entry("daily", "10:00", "daily")];
    const result = getUpcomingMovements(timetable, saturday, 6);
    expect(result.map((m) => m.entry.id)).toEqual(["daily"]);
  });

  it("[CRITICAL] every entry starts neutral: on_time, no actual time, not live", () => {
    const timetable = [entry("a", "10:00")];
    const [movement] = getUpcomingMovements(timetable, MONDAY_09_00, 6);
    expect(movement.status).toBe("on_time");
    expect(movement.actualAt).toBeNull();
    expect(movement.isLive).toBe(false);
    expect(movement.delayMinutes).toBe(0);
  });
});

describe("applyLiveData", () => {
  it("[CRITICAL] matches the nearest live movement within the time window and marks it live", () => {
    const [movement] = getUpcomingMovements([entry("a", "10:00")], MONDAY_09_00, 6);
    const live = [liveMovement({ scheduledDeparture: "2026-10-12T10:02:00", actualDeparture: "2026-10-12T10:02:00", departureDelayMinutes: 0 })];
    const [result] = applyLiveData([movement], live, "departure");
    expect(result.isLive).toBe(true);
    expect(result.status).toBe("on_time");
  });

  it("[CRITICAL] a cancelled train is reported as cancelled regardless of delay", () => {
    const [movement] = getUpcomingMovements([entry("a", "10:00")], MONDAY_09_00, 6);
    const live = [liveMovement({ scheduledDeparture: "2026-10-12T10:00:00", cancelled: true })];
    const [result] = applyLiveData([movement], live, "departure");
    expect(result.status).toBe("cancelled");
  });

  it("[MAJOR] a delay of 3+ minutes is reported as delayed; under 3 stays on_time", () => {
    const [movement] = getUpcomingMovements([entry("a", "10:00")], MONDAY_09_00, 6);

    const barelyLate = applyLiveData(
      [movement],
      [liveMovement({ scheduledDeparture: "2026-10-12T10:00:00", actualDeparture: "2026-10-12T10:02:00", departureDelayMinutes: 2 })],
      "departure",
    );
    expect(barelyLate[0].status).toBe("on_time");

    const reallyLate = applyLiveData(
      [movement],
      [liveMovement({ scheduledDeparture: "2026-10-12T10:00:00", actualDeparture: "2026-10-12T10:05:00", departureDelayMinutes: 5 })],
      "departure",
    );
    expect(reallyLate[0].status).toBe("delayed");
  });

  it("[CRITICAL] a train that hasn't happened yet (no actual time) is never reported as delayed", () => {
    const [movement] = getUpcomingMovements([entry("a", "10:00")], MONDAY_09_00, 6);
    const live = [liveMovement({ scheduledDeparture: "2026-10-12T10:00:00", departureDelayMinutes: 25, actualDeparture: null })];
    const [result] = applyLiveData([movement], live, "departure");
    expect(result.status).toBe("on_time");
  });

  it("[CRITICAL] regression: an entry outside the match window is left unmatched with no fabricated status", () => {
    const [movement] = getUpcomingMovements([entry("a", "10:00")], MONDAY_09_00, 6);
    const live = [liveMovement({ scheduledDeparture: "2026-10-12T10:30:00", cancelled: true })]; // 30 min away, outside the 15-min window
    const [result] = applyLiveData([movement], live, "departure");
    expect(result.isLive).toBe(false);
    expect(result.status).toBe("on_time");
  });

  it("[MAJOR] is a one-to-one match: two timetable entries never claim the same live movement", () => {
    const movements = getUpcomingMovements([entry("a", "10:00"), entry("b", "10:01")], MONDAY_09_00, 6);
    const live = [liveMovement({ scheduledDeparture: "2026-10-12T10:00:30", actualDeparture: "2026-10-12T10:00:30", departureDelayMinutes: 0 })];
    const result = applyLiveData(movements, live, "departure");
    const liveMatches = result.filter((m) => m.isLive);
    expect(liveMatches).toHaveLength(1);
  });

  it("[MAJOR] reads scheduledArrival/scheduledDeparture based on the requested kind", () => {
    const [movement] = getUpcomingMovements([entry("a", "10:00")], MONDAY_09_00, 6);
    const live = [
      liveMovement({
        scheduledArrival: "2026-10-12T10:00:00",
        scheduledDeparture: "2026-10-12T23:00:00", // far away -- should not match for "arrival"
        actualArrival: "2026-10-12T10:00:00",
        arrivalDelayMinutes: 0,
      }),
    ];
    const [result] = applyLiveData([movement], live, "arrival");
    expect(result.isLive).toBe(true);
  });
});
