/**
 * Makes an externally-sourced value (PKP PLK API data, env vars, error messages) safe to
 * interpolate into a log line: CR/LF and other control characters are replaced with a
 * space, so a crafted value can't forge extra log lines or inject terminal escapes into
 * the GitHub Actions log or the summary email built from the same strings.
 */
export function sanitizeForLog(value: unknown): string {
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/[\x00-\x1f\x7f-\x9f\u2028\u2029]/g, ' ')
}
