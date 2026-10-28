import { describe, expect, it, vi } from "vitest";

const { init, captureException } = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn() }));
vi.mock("@sentry/react", () => ({ init, captureException }));

const sentryClient = await import("./sentryClient");

describe("sentryClient", () => {
  it("initializes errors-only reporting without the visitor's cookies, headers or bodies", () => {
    sentryClient.init("https://key@sentry.example/1", "abc123");

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://key@sentry.example/1",
        release: "abc123",
        tracesSampleRate: 0,
        dataCollection: expect.objectContaining({ userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] }),
      }),
    );
  });

  it("passes captureException straight through", () => {
    expect(sentryClient.captureException).toBe(captureException);
  });
});
