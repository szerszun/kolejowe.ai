import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureException, setTag } = vi.hoisted(() => ({ captureException: vi.fn(), setTag: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({
  captureException,
  withScope: (fn: (scope: { setTag: typeof setTag }) => void) => fn({ setTag }),
}));

const { reportErrorToSentry } = await import("./reportErrorToSentry");

type HookArgs = Parameters<typeof reportErrorToSentry>[0];

function args(error: Error, collection?: string): HookArgs {
  return {
    error,
    collection: collection ? { slug: collection } : undefined,
    req: { method: "PATCH" },
    context: {},
  } as unknown as HookArgs;
}

const withStatus = (status: number) => Object.assign(new Error(`status ${status}`), { status });

beforeEach(() => {
  captureException.mockReset();
  setTag.mockReset();
});

describe("reportErrorToSentry", () => {
  it("reports a 5xx with the collection and method as tags", () => {
    const error = withStatus(500);

    reportErrorToSentry(args(error, "stations"));

    expect(captureException).toHaveBeenCalledWith(error);
    expect(setTag).toHaveBeenCalledWith("payload.collection", "stations");
    expect(setTag).toHaveBeenCalledWith("http.method", "PATCH");
  });

  it("reports an error without a status -- an unexpected crash, not an API error", () => {
    const error = new Error("Cannot read properties of undefined");

    reportErrorToSentry(args(error));

    expect(captureException).toHaveBeenCalledWith(error);
    expect(setTag).toHaveBeenCalledWith("payload.collection", "none");
  });

  it.each([400, 401, 403, 404])("doesn't report a %i -- a client mistake, not a bug", (status) => {
    reportErrorToSentry(args(withStatus(status), "feedback"));

    expect(captureException).not.toHaveBeenCalled();
  });
});
