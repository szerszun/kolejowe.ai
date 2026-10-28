import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  define: {
    // Sentry release tag (src/lib/monitoring.ts). RENDER_GIT_COMMIT is set by Render on
    // every build -- the same value scripts/write-version.mjs puts in version.json.
    __APP_COMMIT__: JSON.stringify(process.env.RENDER_GIT_COMMIT ?? 'dev'),
  },
})
