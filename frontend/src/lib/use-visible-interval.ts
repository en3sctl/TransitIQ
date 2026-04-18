import { useEffect, useRef } from "react";

/**
 * Sayfa arka plandaysa interval'i duraklatan setInterval alternatifi.
 *
 * Kullanım:
 *   useVisibleInterval(() => load(), 60000);
 *
 * - Sayfa gizliyken timer çalışmaz (batarya/CPU tasarrufu).
 * - Sayfa geri gelince hemen bir kez çalışır (stale data için).
 * - Unmount'ta temizlenir.
 */
export function useVisibleInterval(callback: () => void, delayMs: number) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => cbRef.current(), delayMs);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        cbRef.current(); // geri gelince bir kez taze veri çek
        start();
      }
    };

    // İlk mount: eğer görünürse interval kurulsun
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [delayMs]);
}
