"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Gradient progress bar at top of page showing scroll depth.
 * Hidden on admin/driver routes.
 */
export function ScrollProgress() {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 20,
    restDelta: 0.001,
  });

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/driver')) return null;

  return <motion.div className="scroll-progress-bar" style={{ scaleX }} />;
}
