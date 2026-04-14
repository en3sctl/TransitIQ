"use client";

import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { ScrollProgress } from "./scroll-progress";
import { BackToTop } from "./back-to-top";
import { ChatbotWidget } from "./chatbot-widget";
import { CommandPalette } from "./command-palette";

/**
 * Aggregates all global UI widgets that should appear on every page:
 * - Smooth scroll (Lenis, disabled on admin/driver)
 * - Scroll progress bar at top
 * - Back-to-top button (bottom right)
 * - Chatbot widget (bottom left, hidden on admin/driver/checkout)
 * - Command palette (Cmd/Ctrl+K)
 *
 * Individual components handle their own route-based visibility.
 */
export function GlobalShell() {
  return (
    <>
      <SmoothScrollProvider />
      <ScrollProgress />
      <BackToTop />
      <ChatbotWidget />
      <CommandPalette />
    </>
  );
}
