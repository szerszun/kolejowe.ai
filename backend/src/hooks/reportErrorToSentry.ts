import * as Sentry from '@sentry/nextjs'
import type { AfterErrorHook } from 'payload'

/**
 * Payload catches errors in its own REST/GraphQL handlers and answers with an error
 * response itself, so Next.js's onRequestError (src/instrumentation.ts) never sees
 * them. Report server errors here instead. 4xx (validation, not found, forbidden) are
 * normal client mistakes, not bugs, and would only drown out the real ones.
 *
 * A no-op when Sentry isn't initialized (no SENTRY_DSN).
 */
export const reportErrorToSentry: AfterErrorHook = ({ error, collection, req }) => {
  const status = (error as { status?: unknown }).status
  if (typeof status === 'number' && status < 500) return
  Sentry.withScope((scope) => {
    scope.setTag('payload.collection', collection?.slug ?? 'none')
    scope.setTag('http.method', req.method ?? 'unknown')
    Sentry.captureException(error)
  })
}
