/**
 * Error reporting to Sentry, switched on only when VITE_SENTRY_DSN is set at build time
 * (Render's static-site env vars, see render.yaml). Without it every function here is a
 * no-op and the Sentry SDK is never downloaded.
 *
 * Errors that happen before the SDK has finished loading are queued and sent once it
 * has, so a crash during the very first render still gets reported.
 */
declare const __APP_COMMIT__: string;

type SentryClient = typeof import("./sentryClient");

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let client: SentryClient | null = null;
const pending: unknown[] = [];

// Until the SDK is in, catch uncaught errors ourselves; once Sentry.init has run, its
// own global handlers take over and these are removed so nothing is reported twice.
const onError = (event: ErrorEvent) => pending.push(event.error ?? event.message);
const onRejection = (event: PromiseRejectionEvent) => pending.push(event.reason);

export function initMonitoring(): void {
  if (!dsn) return;
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  const stopListening = () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
  import("./sentryClient")
    .then((loaded) => {
      stopListening();
      loaded.init(dsn, __APP_COMMIT__);
      client = loaded;
      for (const error of pending.splice(0)) loaded.captureException(error);
    })
    .catch(() => {
      // An ad blocker or a flaky network can block the chunk -- the app must keep
      // working without error reporting.
      stopListening();
      pending.length = 0;
    });
}

export function reportError(error: unknown): void {
  if (!dsn) return;
  if (client) client.captureException(error);
  else pending.push(error);
}
