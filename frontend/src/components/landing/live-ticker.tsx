"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Route, Users, Building2, MapPin, Activity } from "lucide-react";
import api from "@/lib/api";

interface Stats {
  routes: number;
  trips: number;
  upcomingTrips: number;
  confirmedBookings: number;
  tenants: number;
  cities: number;
}

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span>{display.toLocaleString('tr-TR')}</span>;
}

export function LiveTicker() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/routes/public/stats');
        setStats(res.data);
      } catch {
        // fail silent
      }
    })();
  }, []);

  if (!stats) return null;

  const items = [
    { icon: Route, value: stats.routes, label: 'Aktif Rota' },
    { icon: MapPin, value: stats.cities, label: 'Şehir' },
    { icon: Activity, value: stats.upcomingTrips, label: 'Yaklaşan Sefer' },
    { icon: Users, value: stats.confirmedBookings, label: 'Tamamlanan Bilet' },
    { icon: Building2, value: stats.tenants, label: 'Partner Firma' },
  ];

  // Hide ticker if platform is completely empty
  const hasAnyData = items.some((i) => i.value > 0);
  if (!hasAnyData) return null;

  return (
    <section className="py-8 px-6 bg-slate-50 dark:bg-zinc-900/40 border-y border-slate-200/60 dark:border-zinc-800/60">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
            Canlı Platform İstatistikleri
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                    <AnimatedNumber value={item.value} />
                    {item.value >= 100 && <span className="text-base">+</span>}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1 truncate">
                    {item.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
