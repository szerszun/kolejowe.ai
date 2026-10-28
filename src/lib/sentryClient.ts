/**
 * The Sentry browser SDK, kept in its own module so it's only ever loaded through the
 * dynamic import in monitoring.ts -- Vite then puts it in a separate chunk, and the main
 * bundle (and its size budget, scripts/check-bundle-size.mjs) doesn't grow by Sentry's
 * ~25KB gzip for every visitor when no DSN is configured.
 */
import * as Sentry from "@sentry/react";

export function init(dsn: string, release: string) {
  Sentry.init({
    dsn,
    release,
    environment: import.meta.env.MODE,
    // Errors only: no performance tracing or session replay, which would eat into the
    // free plan's quota and record far more about visitors than error reporting needs.
    tracesSampleRate: 0,
    // Sentry 11 collects all of these by default; an error report only needs the stack
    // trace and the page URL, not the visitor's cookies, headers or request bodies.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
    },
  });
}

export const captureException = Sentry.captureException;
