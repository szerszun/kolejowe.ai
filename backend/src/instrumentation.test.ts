import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { init, captureRequestError } = vi.hoisted(() => ({ init: vi.fn(), captureRequestError: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ init, captureRequestError }));

const { register, onRequestError } = await import("./instrumentation");

beforeEach(() => {
  init.mockReset();
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("RENDER_GIT_COMMIT", "abc123");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("instrumentation", () => {
  it("doesn't initialize Sentry without a SENTRY_DSN", () => {
    vi.stubEnv("SENTRY_DSN", "");

    register();

    expect(init).not.toHaveBeenCalled();
  });

  it("doesn't initialize Sentry in the edge runtime", () => {
    vi.stubEnv("SENTRY_DSN", "https://key@sentry.example/1");
    vi.stubEnv("NEXT_RUNTIME", "edge");

    register();

    expect(init).not.toHaveBeenCalled();
  });

  it("initializes errors-only reporting with request data collection switched off", () => {
    vi.stubEnv("SENTRY_DSN", "https://key@sentry.example/1");

    register();

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://key@sentry.example/1",
        release: "abc123",
        tracesSampleRate: 0,
        // Station write bodies and the sync account's API-key header must never be sent.
        dataCollection: expect.objectContaining({
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          databaseQueryData: false,
          stackFrameVariables: false,
        }),
      }),
    );
  });

  it("hands Next.js request errors to Sentry", () => {
    expect(onRequestError).toBe(captureRequestError);
  });
});
