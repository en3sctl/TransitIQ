import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
    ],
  },
};

// Sentry — DSN yoksa wrapper no-op çalışır, build'i etkilemez.
// Source map upload için SENTRY_AUTH_TOKEN env'i ileride eklenecek (post-launch).
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  // Source maps upload sadece SENTRY_AUTH_TOKEN varsa çalışır
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Telemetry'i kapat
  telemetry: false,

  // Bundler tunnel — adblock'lardan korur
  tunnelRoute: '/monitoring',

  // Otomatik instrumentation
  widenClientFileUpload: true,

  // Source map'ler upload'dan sonra silinir — public olarak servis edilmezler.
  // (Sentry v10'da `hideSourceMaps` kaldırıldı, karşılığı bu.)
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
