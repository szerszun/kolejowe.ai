import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const commit = process.env.RENDER_GIT_COMMIT ?? 'dev'

// Source maps for Sentry, so browser stack traces show src/ instead of minified chunks.
// Only when SENTRY_AUTH_TOKEN is set (Render build env, see render.yaml): the maps are
// generated "hidden" (no sourceMappingURL comment), uploaded, then deleted from dist/ so
// they're never served. Without the token the build is exactly as before -- no maps.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    uploadSourceMaps &&
      sentryVitePlugin({
        org: 'ai-manufaktur',
        project: 'kolejowe-frontend',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        // Same release name the SDK reports (src/lib/monitoring.ts). Commit association
        // needs a GitHub integration in Sentry, which isn't set up.
        release: { name: commit, setCommits: false },
        sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
        telemetry: false,
      }),
  ],
  build: {
    sourcemap: uploadSourceMaps ? 'hidden' : false,
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  define: {
    // Sentry release tag (src/lib/monitoring.ts). RENDER_GIT_COMMIT is set by Render on
    // every build -- the same value scripts/write-version.mjs puts in version.json.
    __APP_COMMIT__: JSON.stringify(commit),
  },
})
