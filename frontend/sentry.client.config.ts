/**
 * Sentry — browser side. Next.js app router otomatik bu dosyayı yükler.
 * DSN env'de yoksa init no-op'a düşer.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Performance: prod'da %10 sample, dev'de %100 (debug için)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay yok (free tier'ı yiyor) — istersen aç:
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // PII: kullanıcı IP/header'ı gönderme (KVKK)
    sendDefaultPii: false,

    // Bilinen kullanıcı hatalarını skip et
    ignoreErrors: [
      // Browser extension hataları
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
      // Auth/throttle (beklenen)
      'Network Error',
      'Request aborted',
    ],

    beforeSend(event) {
      // Token / password kazara request body'de varsa redact et
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, any>;
        for (const key of ['password', 'token', 'cardNumber', 'cvv', 'iban', 'tcKimlik']) {
          if (key in data) data[key] = '[REDACTED]';
        }
      }
      return event;
    },
  });
}
