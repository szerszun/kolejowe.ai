import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlkRateLimitError, type PlkOperationStationDto, type PlkTrainOperationDto } from "./plkApi";

const { fetchOperationsForStations, getLastRateLimitStatus } = vi.hoisted(() => ({
  fetchOperationsForStations: vi.fn(),
  getLastRateLimitStatus: vi.fn(),
}));

vi.mock("./plkApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./plkApi")>();
  return { ...actual, fetchOperationsForStations, getLastRateLimitStatus };
});

const { getLiveMovements } = await import("./liveMovements");

const NO_QUOTA_PRESSURE = { hourlyLimit: 100, hourlyRemaining: 50, dailyLimit: 1000, dailyRemaining: 500 };
const QUOTA_EXHAUSTED = { hourlyLimit: 100, hourlyRemaining: 2, dailyLimit: 1000, dailyRemaining: 500 };

function stop(stationId: number, overrides: Partial<PlkOperationStationDto> = {}): PlkOperationStationDto {
  return {
    stationId,
    plannedArrival: null,
    plannedDeparture: null,
    actualArrival: null,
    actualDeparture: null,
    arrivalDelayMinutes: null,
    departureDelayMinutes: null,
    ...overrides,
  };
}

function operations(stationId: number, trainStatus: PlkTrainOperationDto["trainStatus"], stopOverrides: Partial<PlkOperationStationDto> = {}) {
  const train: PlkTrainOperationDto = {
    scheduleId: 1,
    orderId: 1,
    trainOrderId: 1,
    operatingDate: "2026-10-15",
    trainStatus,
    stations: [stop(stationId, stopOverrides)],
  };
  return { generatedAt: "2026-10-15T00:00:00Z", trains: [train], stations: {} };
}

// Each test uses its own plkStationId so the module-level cache Map never leaks state
// between tests (resetting the module between tests would also wipe the vi.mock wiring).
let nextStationId = 1000;
function freshStationId() {
  return ++nextStationId;
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  fetchOperationsForStations.mockReset();
  getLastRateLimitStatus.mockReset().mockReturnValue(NO_QUOTA_PRESSURE);
  // getLiveMovements deliberately logs upstream failures -- expected noise in these tests.
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  consoleErrorSpy.mockRestore();
});

describe("getLiveMovements", () => {
  it("fetches live movements and reports them as fresh", async () => {
    const id = freshStationId();
    fetchOperationsForStations.mockResolvedValue(operations(id, "P"));

    const result = await getLiveMovements(id);

    expect(result).toEqual({ ok: true, stale: false, movements: [expect.objectContaining({ cancelled: false })] });
    expect(fetchOperationsForStations).toHaveBeenCalledTimes(1);
  });

  it("marks a movement cancelled for trainStatus X or Q, not for any other status", async () => {
    const cancelledId = freshStationId();
    fetchOperationsForStations.mockResolvedValueOnce(operations(cancelledId, "X"));
    const cancelled = await getLiveMovements(cancelledId);
    expect(cancelled.ok && cancelled.movements[0].cancelled).toBe(true);

    const onTimeId = freshStationId();
    fetchOperationsForStations.mockResolvedValueOnce(operations(onTimeId, "P"));
    const onTime = await getLiveMovements(onTimeId);
    expect(onTime.ok && onTime.movements[0].cancelled).toBe(false);
  });

  it("serves the cached result on a second call within the TTL, without refetching", async () => {
    const id = freshStationId();
    fetchOperationsForStations.mockResolvedValue(operations(id, "P"));

    await getLiveMovements(id);
    const second = await getLiveMovements(id);

    expect(second.ok && second.stale).toBe(false);
    expect(fetchOperationsForStations).toHaveBeenCalledTimes(1);
  });

  it("returns rate_limited with no cache when the quota is already exhausted", async () => {
    const id = freshStationId();
    getLastRateLimitStatus.mockReturnValue(QUOTA_EXHAUSTED);

    const result = await getLiveMovements(id);

    expect(result).toEqual({ ok: false, reason: "rate_limited" });
    expect(fetchOperationsForStations).not.toHaveBeenCalled();
  });

  it("falls back to a stale cached result, not rate_limited, once the cache has expired and the quota is exhausted", async () => {
    vi.useFakeTimers();
    const id = freshStationId();
    fetchOperationsForStations.mockResolvedValue(operations(id, "P"));
    await getLiveMovements(id); // populates the cache while quota is fine

    vi.advanceTimersByTime(90_001); // past the 90s cache TTL
    getLastRateLimitStatus.mockReturnValue(QUOTA_EXHAUSTED);

    const result = await getLiveMovements(id);

    expect(result).toEqual({ ok: true, stale: true, movements: expect.any(Array) });
    expect(fetchOperationsForStations).toHaveBeenCalledTimes(1); // never re-fetched once quota looked exhausted
  });

  it("reports upstream_error with no cache when the upstream fetch throws a non-429 error", async () => {
    const id = freshStationId();
    fetchOperationsForStations.mockRejectedValue(new Error("network boom"));

    const result = await getLiveMovements(id);

    expect(result).toEqual({ ok: false, reason: "upstream_error" });
  });

  it("reports rate_limited (not upstream_error) when the fetch itself throws PlkRateLimitError", async () => {
    const id = freshStationId();
    fetchOperationsForStations.mockRejectedValue(new PlkRateLimitError("429"));

    const result = await getLiveMovements(id);

    expect(result).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("falls back to a stale cached result, not upstream_error, once the cache has expired and a later fetch fails", async () => {
    vi.useFakeTimers();
    const id = freshStationId();
    fetchOperationsForStations.mockResolvedValueOnce(operations(id, "P"));
    await getLiveMovements(id); // populates the cache

    vi.advanceTimersByTime(90_001);
    fetchOperationsForStations.mockRejectedValueOnce(new Error("network boom"));

    const result = await getLiveMovements(id);

    expect(result).toEqual({ ok: true, stale: true, movements: expect.any(Array) });
  });
});
