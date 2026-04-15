"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Auto-rotating hero background carousel with Ken Burns zoom effect.
 * Cross-fades between iconic Turkish landmarks every 6 seconds.
 */

const SLIDES = [
  { src: '/kapadokya.png', alt: 'Kapadokya' },
  { src: '/bogaz_kopru.jpg', alt: 'İstanbul Boğazı' },
  { src: '/uzungol.webp', alt: 'Uzungöl, Trabzon' },
  { src: '/traverten.jpg', alt: 'Pamukkale' },
  { src: '/nemrut.jpg', alt: 'Nemrut Dağı' },
  { src: '/ortakoy.jpg', alt: 'Ortaköy, İstanbul' },
  { src: '/ortakoy2.jpg', alt: 'Ortaköy, İstanbul' },
  { src: '/halic.jpg', alt: 'Haliç, İstanbul' },
  { src: '/anitkabir.jpg', alt: 'Anıtkabir, Ankara' },
  { src: '/anit.jpg', alt: 'Anıtkabir, Ankara' },
  { src: '/ayasofya.webp', alt: 'Ayasofya, İstanbul' },
  { src: '/kiz_kulesi.jpg', alt: 'Kız Kulesi, İstanbul' },
  { src: '/kiz_kulesi2.jpg', alt: 'Kız Kulesi, İstanbul' },
  { src: '/camlica.png', alt: 'Çamlıca, İstanbul' },
  { src: '/yss.jpg', alt: 'Yavuz Sultan Selim Köprüsü' },
  { src: '/efes.jpg', alt: 'Efes Antik Kenti' },
  { src: '/harabeler.jpg', alt: 'Efes harabeleri' },
  { src: '/balikligol.webp', alt: 'Balıklıgöl, Şanlıurfa' },
];

const INTERVAL_MS = 6000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ opacity: { duration: 1.5 }, scale: { duration: INTERVAL_MS / 1000 + 1.5, ease: 'linear' } }}
          className="absolute inset-0"
        >
          <Image
            src={SLIDES[index].src}
            alt={SLIDES[index].alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-white/60 dark:from-zinc-950/50 dark:via-zinc-950/30 dark:to-zinc-950/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-white/80 dark:to-zinc-950/80" />
    </div>
  );
}
