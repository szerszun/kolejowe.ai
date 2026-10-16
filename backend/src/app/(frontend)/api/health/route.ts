/**
 * Deploy-verification endpoint, not an app feature -- used by the CI
 * production-smoke job (.github/workflows/regression.yml) to confirm
 * Render actually finished deploying the commit that was just pushed,
 * not just that *some* version of the backend is up (a failed Render
 * build leaves the previous commit serving traffic with no visible
 * error, which is exactly what happened once this project hit a real
 * backend build failure that CI's own ephemeral build never caught).
 *
 * RENDER_GIT_COMMIT is set automatically by Render on every build/deploy
 * (https://render.com/docs/environment-variables#all-runtimes) -- no
 * extra configuration needed on Render's side.
 */
export function GET() {
  return Response.json({
    ok: true,
    commit: process.env.RENDER_GIT_COMMIT ?? null,
  })
}
