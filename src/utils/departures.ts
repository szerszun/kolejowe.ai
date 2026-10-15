import type { DaysOfOperation, LiveMovement } from "../types";

export type DepartureStatus = "on_time" | "delayed" | "cancelled";

interface TimedEntry {
  id: string;
  time: string;
  daysOfOperation: DaysOfOperation;
}

export interface UpcomingMovement<T> {
  entry: T;
  scheduledAt: Date;
  actualAt: Date | null;
  delayMinutes: number;
  status: DepartureStatus;
  /** True once matched to a real PKP PLK operation (see applyLiveData) rather than the mocked placeholder. */
  isLive: boolean;
}

function runsOnDate(days: DaysOfOperation, date: Date): boolean {
  const day = date.getDay();
  if (days === "daily") return true;
  if (days === "weekend") return day === 0 || day === 6;
  return day >= 1 && day <= 5;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Deterministic per entry+day so a delay/cancellation is stable within a
// given day instead of flickering on every re-render -- there's no real
// dispatch system behind this draft, just a stand-in for what live running
// information would look like.
function mockRealtimeFor(entryId: string, dateKey: string): { status: DepartureStatus; delayMinutes: number } {
  const h = hashString(`${entryId}:${dateKey}`);
  const bucket = h % 10;
  if (bucket === 9) return { status: "cancelled", delayMinutes: 0 };
  if (bucket >= 6) return { status: "delayed", delayMinutes: 2 + (h % 13) };
  return { status: "on_time", delayMinutes: 0 };
}

// Shared by the Departures and Arrivals tabs -- same "what's happening in
// the next N hours" windowing and mock realtime status logic, just fed a
// different entry list (departures keyed by destination, arrivals by
// origin).
export function getUpcomingMovements<T extends TimedEntry>(timetable: T[], now: Date, hoursAhead = 6): UpcomingMovement<T>[] {
  const result: UpcomingMovement<T>[] = [];

  for (const dayOffset of [0, 1]) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);

    for (const entry of timetable) {
      if (!runsOnDate(entry.daysOfOperation, day)) continue;
      const [hours, minutes] = entry.time.split(":").map(Number);
      const scheduledAt = new Date(day);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const diffHours = (scheduledAt.getTime() - now.getTime()) / 3_600_000;
      if (diffHours < 0 || diffHours > hoursAhead) continue;

      const dateKey = scheduledAt.toISOString().slice(0, 10);
      const { status, delayMinutes } = mockRealtimeFor(entry.id, dateKey);
      const actualAt = status === "cancelled" ? null : new Date(scheduledAt.getTime() + delayMinutes * 60_000);
      result.push({ entry, scheduledAt, actualAt, delayMinutes, status, isLive: false });
    }
  }

  result.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  return result;
}

const LIVE_MATCH_WINDOW_MS = 15 * 60_000;
const DELAY_THRESHOLD_MINUTES = 3;

// PLK's planned/actual timestamps come back as naive local wall-clock time
// (no timezone offset), same as the static timetable's "HH:mm" entries --
// both get parsed as the viewer's local time, which only lines up exactly
// for a Poland-based viewer. Same simplification the rest of this file
// already makes for the static timetable; not worth fixing for this draft.
function liveTimeFor(movement: LiveMovement, kind: "departure" | "arrival"): string | null {
  return kind === "departure" ? movement.scheduledDeparture : movement.scheduledArrival;
}

// Greedy nearest-time, one-to-one match between our static timetable
// entries and PLK's real operations for the same station -- there's no
// shared train-number key to join on, so this is an approximation, not an
// exact correlation. Each live movement is used for at most one entry.
export function applyLiveData<T>(
  movements: UpcomingMovement<T>[],
  live: LiveMovement[],
  kind: "departure" | "arrival",
): UpcomingMovement<T>[] {
  if (live.length === 0) return movements;
  const used = new Set<number>();

  return movements.map((movement) => {
    let bestIndex = -1;
    let bestDiff = LIVE_MATCH_WINDOW_MS;

    for (let i = 0; i < live.length; i++) {
      if (used.has(i)) continue;
      const liveTime = liveTimeFor(live[i], kind);
      if (!liveTime) continue;
      const diff = Math.abs(new Date(liveTime).getTime() - movement.scheduledAt.getTime());
      if (diff <= bestDiff) {
        bestDiff = diff;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) return movement;
    used.add(bestIndex);
    const match = live[bestIndex];
    const delayMinutes = (kind === "departure" ? match.departureDelayMinutes : match.arrivalDelayMinutes) ?? 0;
    const actualIso = kind === "departure" ? match.actualDeparture : match.actualArrival;
    // Not yet happened (no actual time reported) reads as "on time" -- same
    // as the pre-live placeholder behavior: nothing's known to be wrong yet.
    const status: DepartureStatus = match.cancelled ? "cancelled" : actualIso && delayMinutes >= DELAY_THRESHOLD_MINUTES ? "delayed" : "on_time";

    return {
      ...movement,
      status,
      delayMinutes,
      actualAt: actualIso ? new Date(actualIso) : movement.actualAt,
      isLive: true,
    };
  });
}
