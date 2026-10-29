import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // No full CSP: Payload's admin UI relies on inline scripts and styles. These stop the
  // admin pages being framed by another site (clickjacking) and harden the API responses.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
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
