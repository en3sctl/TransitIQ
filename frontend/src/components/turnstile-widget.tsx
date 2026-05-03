"use client";

import { Turnstile } from '@marsidev/react-turnstile';
import { useTheme } from 'next-themes';

/**
 * Cloudflare Turnstile widget — register/login form'larında bot koruması.
 *
 * Setup:
 *   1. https://dash.cloudflare.com/?to=/:account/turnstile → Site ekle
 *   2. NEXT_PUBLIC_TURNSTILE_SITE_KEY env'ine site key'i koy
 *   3. Backend .env'e TURNSTILE_SECRET_KEY (siteverify için)
 *
 * Site key yoksa widget render edilmez (dev mode — engelsiz form).
 *
 * onVerify(token) → form submit'te body.turnstileToken olarak gönderilir.
 */
export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const { resolvedTheme } = useTheme();

  if (!siteKey) {
    // Setup bitmemiş — sessizce widget render etme. Backend de no-op modda.
    return null;
  }

  return (
    <div className="flex justify-center my-2">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onVerify}
        onExpire={onExpire}
        onError={onError}
        options={{
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          size: 'flexible',
          // Yolcu UX'i: çoğu zaman görünmez (managed mode), sadece şüpheli trafikte challenge
          appearance: 'interaction-only',
        }}
      />
    </div>
  );
}
