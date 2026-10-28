import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { init, captureException } = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn() }));
vi.mock("./sentryClient", () => ({ init, captureException }));

async function loadMonitoring(dsn: string | undefined) {
  vi.resetModules();
  vi.stubEnv("VITE_SENTRY_DSN", dsn ?? "");
  return import("./monitoring");
}

beforeEach(() => {
  init.mockReset();
  captureException.mockReset();
  (globalThis as { __APP_COMMIT__?: string }).__APP_COMMIT__ = "abc123";
  // The unit tests run in Node, which has no window -- an EventTarget is all monitoring.ts uses.
  vi.stubGlobal("window", new EventTarget());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("monitoring", () => {
  it("does nothing at all without a DSN -- the Sentry SDK is never loaded", async () => {
    const { initMonitoring, reportError } = await loadMonitoring(undefined);

    initMonitoring();
    reportError(new Error("boom"));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(init).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("initializes Sentry with the DSN and the build's commit as release", async () => {
    const { initMonitoring } = await loadMonitoring("https://key@sentry.example/1");

    initMonitoring();

    await vi.waitFor(() => expect(init).toHaveBeenCalledWith("https://key@sentry.example/1", "abc123"));
  });

  it("queues errors reported before the SDK has loaded, and sends them once it has", async () => {
    const { initMonitoring, reportError } = await loadMonitoring("https://key@sentry.example/1");
    const early = new Error("during first render");

    initMonitoring();
    reportError(early);
    expect(captureException).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(captureException).toHaveBeenCalledWith(early));
  });

  it("queues an uncaught window error from before the SDK loaded, then stops listening", async () => {
    const { initMonitoring } = await loadMonitoring("https://key@sentry.example/1");
    const crash = new Error("chunk failed");

    initMonitoring();
    window.dispatchEvent(Object.assign(new Event("error"), { error: crash }));
    await vi.waitFor(() => expect(captureException).toHaveBeenCalledWith(crash));

    // From here on Sentry's own global handlers report these, so ours must be gone.
    window.dispatchEvent(Object.assign(new Event("error"), { error: new Error("after load") }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("sends errors straight through once the SDK is loaded", async () => {
    const { initMonitoring, reportError } = await loadMonitoring("https://key@sentry.example/1");
    initMonitoring();
    await vi.waitFor(() => expect(init).toHaveBeenCalled());
    const later = new Error("later");

    reportError(later);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(later);
  });

  it("keeps working without error reporting when the SDK chunk can't load (e.g. an ad blocker)", async () => {
    vi.doMock("./sentryClient", () => {
      throw new Error("blocked by client");
    });
    const { initMonitoring, reportError } = await loadMonitoring("https://key@sentry.example/1");

    initMonitoring();
    reportError(new Error("queued before the load failed"));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(init).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
    // The pre-load listeners are gone again, so errors don't pile up in memory forever.
    expect(() => window.dispatchEvent(Object.assign(new Event("error"), { error: new Error("x") }))).not.toThrow();
    vi.doMock("./sentryClient", () => ({ init, captureException }));
  });
});
