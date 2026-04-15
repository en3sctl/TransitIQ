"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tag, ArrowRight, Clock, Bus, Calendar } from "lucide-react";
import api from "@/lib/api";
import { getCityImageWithFallback, resolveCityImage, type CityImage } from "@/lib/city-images";

interface CheapTrip {
  id: string;
  origin: { city: string; name: string };
  destination: { city: string; name: string };
  price: number;
  departureTime: string;
  estimatedArrival: string | null;
  distanceKm: number | null;
  tenant: { name: string; slug: string };
  vehicle: { registrationPlate: string; model: string | null } | null;
  bookingCount: number;
}

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function formatDate(s: string) {
  const d = new Date(s);
  return {
    day: d.getDate(),
    month: MONTHS[d.getMonth()],
    weekday: DAYS[d.getDay()],
    time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function duration(dep: string, arr: string | null) {
  if (!arr) return null;
  const ms = new Date(arr).getTime() - new Date(dep).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}sa ${m > 0 ? m + 'dk' : ''}`.trim();
}

export function CheapTrips() {
  const [trips, setTrips] = useState<CheapTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageMap, setImageMap] = useState<Record<string, CityImage>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/trips/public/cheap', { params: { limit: 6 } });
        setTrips(res.data || []);
      } catch {
        setTrips([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Async resolve images for ORIGIN cities (kalkış yeri) — where the passenger boards.
  useEffect(() => {
    if (trips.length === 0) return;
    (async () => {
      const results: Record<string, CityImage> = {};
      await Promise.allSettled(
        trips.map(async (t, i) => {
          const key = t.origin.city;
          if (imageMap[key]) return;
          try {
            results[key] = await resolveCityImage(t.origin.city, i);
          } catch {
            // ignore individual failures
          }
        }),
      );
      if (Object.keys(results).length > 0) {
        setImageMap((prev) => ({ ...prev, ...results }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  if (!loading && trips.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-slate-50 dark:bg-zinc-900/40">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-4">
              <Tag className="w-3.5 h-3.5" />
              En Uygun Fiyat
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
              Ucuz Seferler
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium max-w-xl">
              Yaklaşan en uygun fiyatlı seferler. Stok sınırlı — fiyatlar hızla değişir.
            </p>
          </div>
          <Link
            href="/rotalar"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all"
          >
            Tüm Seferler <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-white dark:bg-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((t, i) => {
              const dep = formatDate(t.departureTime);
              const dur = duration(t.departureTime, t.estimatedArrival);
              const img = imageMap[t.origin.city] || getCityImageWithFallback(t.origin.city, i);
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/search?from=${encodeURIComponent(t.origin.city)}&to=${encodeURIComponent(t.destination.city)}&date=${t.departureTime.split('T')[0]}`}
                    className="group block bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl hover:shadow-emerald-500/5 transition-all"
                  >
                    <div className="flex items-center gap-0 flex-wrap">
                      {/* Destination photo thumbnail */}
                      <div className="relative w-24 h-24 shrink-0 overflow-hidden hidden sm:block">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          sizes="96px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex items-center gap-5 flex-wrap p-5 flex-1">
                      {/* Date */}
                      <div className="flex flex-col items-center w-16 shrink-0 pr-4 border-r border-slate-100 dark:border-zinc-800">
                        <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">{dep.day}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">{dep.month}</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5">{dep.weekday}</span>
                      </div>

                      {/* Route */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">{t.origin.city}</span>
                          <span className="flex-1 border-t border-dashed border-slate-300 dark:border-zinc-700" />
                          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">{t.destination.city}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex-wrap">
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {dep.time}</span>
                          {dur && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {dur}</span>}
                          <span className="inline-flex items-center gap-1"><Bus className="w-3 h-3" /> {t.tenant.name}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Başlangıç</p>
                        <p className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                          ₺{t.price.toLocaleString('tr-TR')}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white font-bold text-xs transition-colors">
                          Bilet Al <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      </div>
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
