"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, MapPin, Flame } from "lucide-react";
import api from "@/lib/api";

interface PopularRoute {
  id: string;
  origin: { city: string; name: string };
  destination: { city: string; name: string };
  price: number;
  distanceKm: number;
  bookingCount: number;
  tripCount: number;
  nextDeparture: string | null;
}

export function PopularRoutes() {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/routes/public/popular', { params: { limit: 8 } });
        setRoutes(res.data || []);
      } catch {
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && routes.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-white dark:bg-zinc-950 border-t border-slate-200/60 dark:border-zinc-800/60">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-bold mb-4">
              <Flame className="w-3.5 h-3.5" />
              En Çok Tercih Edilen
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
              Popüler Rotalar
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium max-w-xl">
              Yolcuların en çok seçtiği güzergahlar. Hemen keşfet, yerini ayırt.
            </p>
          </div>
          <Link
            href="/rotalar"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all"
          >
            Tüm Rotalar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {routes.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/search?from=${encodeURIComponent(r.origin.city)}&to=${encodeURIComponent(r.destination.city)}`}
                  className="group block bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">#{i + 1}</span>
                    {r.bookingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                        <TrendingUp className="w-3 h-3" /> {r.bookingCount}+ yolcu
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-base font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {r.origin.city}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-5">↓</p>
                    <p className="text-base font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {r.destination.city}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      {r.tripCount} sefer
                    </span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      ₺{r.price.toLocaleString('tr-TR')}<span className="text-[10px] text-slate-400 ml-1">'den</span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
