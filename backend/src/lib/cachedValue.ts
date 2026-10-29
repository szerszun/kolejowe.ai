/**
 * One cached value, built on first use and kept until invalidate() is called. A build
 * that's in flight is shared, so a burst of requests after a restart or an edit runs
 * the expensive query once, not once per request. A failed build isn't cached, and a
 * build that was running when invalidate() was called still answers its own callers
 * but isn't kept for later ones -- it may predate the change.
 *
 * In-process only: fine for the single backend instance this runs on.
 */
export function cachedValue<T>(build: () => Promise<T>) {
  let pending: Promise<T> | undefined

  return {
    get(): Promise<T> {
      if (!pending) {
        const attempt = build()
        pending = attempt
        attempt.catch(() => {
          if (pending === attempt) pending = undefined
        })
      }
      return pending
    },
    invalidate(): void {
      pending = undefined
    },
  }
}
