"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
}

/**
 * Theme-aware TransitIQ logo.
 * - Light mode → dark variant (so it's visible on white backgrounds)
 * - Dark mode → white variant (so it's visible on dark backgrounds)
 *
 * Renders a neutral placeholder until the theme is resolved on the client
 * to avoid hydration flicker.
 */
export function BrandLogo({
  className = "h-14 w-auto select-none",
  width = 260,
  height = 142,
  priority = false,
  alt = "TransitIQ",
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / before hydration, render the dark variant.
  // After mount, pick based on theme.
  const src = !mounted || resolvedTheme === "light" ? "/logoo-dark.png" : "/logoo-light.png";

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
