"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Flame } from "lucide-react";
import api from "@/lib/api";
import { getCityImageWithFallback, resolveCityImage, type CityImage } from "@/lib/city-images";

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

export function PopularRoutes({ initialRoutes = [] }: { initialRoutes?: PopularRoute[] } = {}) {
  const [routes, setRoutes] = useState<PopularRoute[]>(initialRoutes);
  const [loading, setLoading] = useState(initialRoutes.length === 0);
  const [imageMap, setImageMap] = useState<Record<string, CityImage>>({});

  useEffect(() => {
    if (initialRoutes.length > 0) return; // Server'dan veri geldiyse fetch'e gerek yok
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve images for cities without curated photos (async Wikipedia fallback)
  useEffect(() => {
    if (routes.length === 0) return;
    (async () => {
      const results: Record<string, CityImage> = {};
      await Promise.allSettled(
        routes.map(async (r, i) => {
          const key = r.destination.city;
          if (imageMap[key]) return;
          try {
            results[key] = await resolveCityImage(r.destination.city, i);
          } catch {
            // Individual failure should not block others
          }
        }),
      );
      if (Object.keys(results).length > 0) {
        setImageMap((prev) => ({ ...prev, ...results }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes]);

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
              <div key={i} className="h-64 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {routes.map((r, i) => {
              const img = imageMap[r.destination.city] || getCityImageWithFallback(r.destination.city, i);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/search?from=${encodeURIComponent(r.origin.city)}&to=${encodeURIComponent(r.destination.city)}${r.nextDeparture ? `&date=${r.nextDeparture.split('T')[0]}` : ''}`}
                    className="group block relative h-64 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    {/* Background photo */}
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Dark gradient for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

                    {/* Rank badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-black uppercase tracking-widest">
                        #{i + 1}
                      </span>
                    </div>
                    {r.bookingCount > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold">
                          <TrendingUp className="w-2.5 h-2.5" /> {r.bookingCount}+
                        </span>
                      </div>
                    )}

                    {/* Route label at top */}
                    <div className="absolute top-12 left-4 right-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1">
                        {r.origin.city}
                      </p>
                      <p className="text-2xl font-black tracking-tighter text-white leading-none">
                        {r.destination.city}
                      </p>
                    </div>

                    {/* Bottom: stats + price */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Başlangıç</p>
                        <p className="text-xl font-black tracking-tighter text-white">
                          ₺{r.price.toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white text-[10px] font-bold group-hover:bg-white group-hover:text-slate-900 transition-colors">
                        {r.tripCount} sefer <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
