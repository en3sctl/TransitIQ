import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cloudflare Turnstile token doğrulama.
 *
 * Frontend formdan `cf-turnstile-response` token'ı alıp body'de gönderir.
 * Backend bu token'ı Cloudflare'in siteverify endpoint'inde doğrular.
 *
 * Setup:
 *   1. https://dash.cloudflare.com/?to=/:account/turnstile → Site ekle (managed/non-interactive/invisible)
 *   2. Site key (public) → frontend .env: NEXT_PUBLIC_TURNSTILE_SITE_KEY
 *   3. Secret key → backend .env: TURNSTILE_SECRET_KEY
 *
 * Setup bitmeden secret yoksa: bu service no-op (geliştirme aşamasında bot koruması yok ama crash da yok).
 *
 * Ücretsiz: 1M doğrulama/ay platform genelinde.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly siteVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private config: ConfigService) {}

  /**
   * Token'ı Cloudflare'e gönder, geçerliyse devam, değilse 403.
   * Secret yoksa no-op (setup bitmemiş — dev mode).
   */
  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) {
      this.logger.debug('TURNSTILE_SECRET_KEY yok — bot doğrulama atlanıyor (dev mode)');
      return;
    }
    if (!token) {
      throw new ForbiddenException('Bot doğrulaması yapılmadı');
    }

    try {
      const body = new URLSearchParams();
      body.append('secret', secret);
      body.append('response', token);
      if (remoteIp) body.append('remoteip', remoteIp);

      const res = await fetch(this.siteVerifyUrl, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };

      if (!data.success) {
        const codes = data['error-codes']?.join(', ') || 'unknown';
        this.logger.warn(`Turnstile verify failed: ${codes}`);
        // Kullanıcıya generic mesaj — hata kodları sızdırma
        throw new ForbiddenException('Bot doğrulaması başarısız — tekrar dene');
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      // Cloudflare unreachable: fail-open mu fail-closed mu?
      // Login için fail-open (kullanıcı login yapamamasın), bot tarafı brute-force tracker zaten kontrol ediyor.
      this.logger.error(`Turnstile siteverify network error: ${err?.message || err}`);
    }
  }
}
