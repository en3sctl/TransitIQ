/**
 * Sentry init — main.ts'in EN ÜSTÜNDE import edilir.
 * Server bootstrap'tan önce yüklenmesi gerekiyor; aksi halde initial
 * exception'ları yakalayamaz (NestFactory error'ları dahil).
 *
 * DSN env'de yoksa no-op modda çalışır (zarar vermez, log üretmez).
 * Free tier 5K event/ay yeterli — sample rate'leri prod'da düşür.
 */

import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const dsn = process.env.SENTRY_DSN;
const env = process.env.NODE_ENV || 'development';

if (dsn) {
  Sentry.init({
    dsn,
    environment: env,
    integrations: [nodeProfilingIntegration()],

    // Performance: prod'da %10, dev'de %100 (debug için)
    tracesSampleRate: env === 'production' ? 0.1 : 1.0,
    profilesSampleRate: env === 'production' ? 0.1 : 0,

    // PII: kişisel veri kazara gönderilmesin (KVKK uyumu)
    sendDefaultPii: false,

    // Filter sensitive data: token/password/iban gibi alanları redact et
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      // Body içinde password/token alanı varsa maskele
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, any>;
        for (const key of ['password', 'token', 'cardNumber', 'cvv', 'iban', 'tcKimlik']) {
          if (key in data) data[key] = '[REDACTED]';
        }
      }
      return event;
    },

    // Bilinen ignore'ları: throttle, validation, kullanıcı hatası
    ignoreErrors: [
      'ThrottlerException',
      'ValidationError',
      'BadRequestException',
      'UnauthorizedException',
      'ForbiddenException',
    ],
  });
} else if (env === 'production') {
  // Prod'da Sentry açık olmalı — uyarı log'la
  // eslint-disable-next-line no-console
  console.warn('[Sentry] SENTRY_DSN yok — production hata takibi devre dışı');
}
