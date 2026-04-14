"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Global smooth-scroll provider using Lenis.
 * Disabled on admin routes (tables/forms need native scroll) and on reduced-motion.
 */
export function SmoothScrollProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/driver');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isAdmin || reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
