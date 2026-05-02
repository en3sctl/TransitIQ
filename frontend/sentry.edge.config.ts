/**
 * Sentry — Edge runtime (middleware.ts, edge route handlers).
 * V8 isolate ortamı; Node API'leri yok, sadece Web standartları.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
  });
}
