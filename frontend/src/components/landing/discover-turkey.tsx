"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * Editorial destination gallery — asymmetric 2-col layout, no grid overlap.
 * Left: 1 large hero image (full height).
 * Right: 4 stacked smaller cards in a 2x2 sub-grid.
 */

interface Destination {
  city: string;
  label: string;
  tagline: string;
  image: string;
}

const HERO: Destination = {
  city: 'Nevşehir',
  label: 'Kapadokya',
  tagline: 'Peribacaları ve sıcak hava balonları',
  image: '/kapadokya.png',
};

const SIDES: Destination[] = [
  { city: 'İstanbul', label: 'Boğaz', tagline: 'İki kıta, tek şehir', image: '/bogaz_kopru.jpg' },
  { city: 'Trabzon', label: 'Uzungöl', tagline: "Karadeniz'in saklı cenneti", image: '/uzungol.webp' },
  { city: 'Denizli', label: 'Pamukkale', tagline: 'Bembeyaz travertenler', image: '/traverten.jpg' },
  { city: 'Adıyaman', label: 'Nemrut Dağı', tagline: 'Günün doğuşuna tanıklık et', image: '/nemrut.jpg' },
];

function DestinationCard({ d, size }: { d: Destination; size: 'lg' | 'sm' }) {
  const isLg = size === 'lg';
  return (
    <Link
      href={`/search?to=${encodeURIComponent(d.city)}`}
      className="group relative h-full block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      <Image
        src={d.image}
        alt={`${d.label}, ${d.city}`}
        fill
        sizes={isLg ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'}
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <p className={`${isLg ? 'text-xs' : 'text-[10px]'} font-bold uppercase tracking-[0.2em] text-white/80 mb-1`}>
          {d.city}
        </p>
        <h3 className={`${isLg ? 'text-4xl md:text-5xl' : 'text-xl md:text-2xl'} font-black tracking-tighter text-white leading-none mb-2`}>
          {d.label}
        </h3>
        <p className={`${isLg ? 'text-sm' : 'text-[11px]'} text-white/80 font-medium`}>{d.tagline}</p>
      </div>

      <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:rotate-45 transition-all duration-300">
        <ArrowUpRight className="w-4 h-4 text-white" />
      </div>
    </Link>
  );
}

export function DiscoverTurkey() {
  return (
    <section className="py-20 px-6 bg-slate-50 dark:bg-zinc-900/40">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-3">
            Destinasyonlar
          </p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.05]">
            Türkiye'nin saklı köşelerini keşfet.
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium mt-3">
            Her yolculuk yeni bir hikaye. Bir otobüs biletinden ibaret değil — bir deneyim.
          </p>
        </div>

        {/* Layout: left hero (full height), right 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Hero — takes full column, large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="h-[560px]"
          >
            <DestinationCard d={HERO} size="lg" />
          </motion.div>

          {/* Right — 2x2 grid of smaller cards */}
          <div className="grid grid-cols-2 gap-3">
            {SIDES.map((d, i) => (
              <motion.div
                key={d.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="h-[272px]"
              >
                <DestinationCard d={d} size="sm" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
