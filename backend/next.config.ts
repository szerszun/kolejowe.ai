import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const config = withPayload(nextConfig, { devBundleServerPackages: false })

// Source maps for Sentry, so server stack traces (src/instrumentation.ts) point at the
// TypeScript sources. Only when SENTRY_AUTH_TOKEN is set (Render build env, see
// render.yaml); without it the build is left exactly as it was. The SDK deletes the maps
// it generated after uploading them.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(config, {
      org: 'ai-manufaktur',
      project: 'kolejowe-backend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Same release name the SDK reports (src/instrumentation.ts). Commit association
      // needs a GitHub integration in Sentry, which isn't set up.
      release: { name: process.env.RENDER_GIT_COMMIT, setCommits: false },
      telemetry: false,
    })
  : config
