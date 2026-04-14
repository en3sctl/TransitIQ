"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor-following spotlight effect for hero section.
 * Renders a soft radial gradient that follows the mouse.
 * Respects prefers-reduced-motion.
 */
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const el = ref.current;
    if (!el) return;

    let raf: number | null = null;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top) / rect.height) * 100;
      if (raf === null) raf = requestAnimationFrame(update);
    };

    const update = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      el.style.setProperty('--sx', `${currentX}%`);
      el.style.setProperty('--sy', `${currentY}%`);
      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        raf = requestAnimationFrame(update);
      } else {
        raf = null;
      }
    };

    const parent = el.parentElement;
    parent?.addEventListener('mousemove', handleMove);
    return () => {
      parent?.removeEventListener('mousemove', handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 z-[15] pointer-events-none transition-opacity duration-500"
      style={{
        background:
          'radial-gradient(600px circle at var(--sx, 50%) var(--sy, 50%), rgba(99, 102, 241, 0.12), transparent 60%)',
      }}
    />
  );
}
