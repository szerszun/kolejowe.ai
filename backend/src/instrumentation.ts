/**
 * Next.js loads this once per server start (https://nextjs.org/docs/app/guides/instrumentation).
 * Error reporting to Sentry is switched on only when SENTRY_DSN is set (Render env vars,
 * see render.yaml) -- without it, nothing is initialized and nothing is sent.
 *
 * Two ways errors reach Sentry: onRequestError below for anything Next.js itself sees
 * fail (route handlers, the admin UI's server components), and the afterError hook in
 * payload.config.ts for errors Payload catches and turns into a 5xx response itself,
 * which Next.js never sees as a failure.
 */
import * as Sentry from '@sentry/nextjs'

export function register() {
  if (!process.env.SENTRY_DSN || process.env.NEXT_RUNTIME !== 'nodejs') return
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.RENDER_GIT_COMMIT,
    environment: process.env.NODE_ENV,
    // Errors only: no performance tracing, which would eat into the free plan's quota.
    tracesSampleRate: 0,
    // Sentry 11 collects all of these by default. Request bodies here are full station
    // writes, headers carry the sync account's API key, and stack-frame variables can hold
    // either -- an error report only needs the stack trace and the URL.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      databaseQueryData: false,
      stackFrameVariables: false,
    },
  })
}

export const onRequestError = Sentry.captureRequestError
