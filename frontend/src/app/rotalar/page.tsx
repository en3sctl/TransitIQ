"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Clock, Ticket, Loader2, Bus, Sparkles } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import api from "@/lib/api";

interface PublicRoute {
  id: string;
  origin: { city: string; name: string };
  destination: { city: string; name: string };
  price: number;
  distanceKm: number;
  nextDeparture: string | null;
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function fDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function RoutesListingPage() {
  const [routes, setRoutes] = useState<PublicRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/routes/public');
        setRoutes(res.data);
      } catch {
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase().trim();
    return routes.filter(
      (r) =>
        r.origin.city.toLowerCase().includes(q) ||
        r.destination.city.toLowerCase().includes(q) ||
        r.origin.name.toLowerCase().includes(q) ||
        r.destination.name.toLowerCase().includes(q),
    );
  }, [routes, search]);

  // Group by origin city
  const grouped = useMemo(() => {
    const map: Record<string, PublicRoute[]> = {};
    for (const r of filtered) {
      const city = r.origin.city;
      if (!map[city]) map[city] = [];
      map[city].push(r);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'tr'));
  }, [filtered]);

  const minPrice = filtered.length > 0 ? Math.min(...filtered.map((r) => r.price)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-transparent dark:from-indigo-950/20 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            {routes.length > 0 ? `${routes.length} aktif rota` : 'Tüm rotalar'}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 leading-[1.05]">
            Türkiye&rsquo;nin her yerine<br />
            <span className="text-indigo-600 dark:text-indigo-400">otobüs biletin</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 font-medium max-w-2xl">
            {filtered.length > 0 ? `Uygun fiyat ₺${minPrice}&apos;den başlıyor. ` : ''}
            İstediğin şehri bul, yola çık.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Şehir veya otogar ara..."
              className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-base font-semibold focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl">
            <Bus className="w-16 h-16 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
              {search ? `&quot;${search}&quot; için rota bulunamadı` : 'Henüz rota yok'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Farklı bir arama terimi deneyin veya anasayfadaki arama kutusunu kullanın.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([city, routesInCity], groupIndex) => (
              <motion.section
                key={city}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">{city}&apos;dan kalkışlar</h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{routesInCity.length} varış noktası</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {routesInCity.map((r) => (
                    <Link
                      key={r.id}
                      href={`/search?from=${encodeURIComponent(r.origin.city)}&to=${encodeURIComponent(r.destination.city)}&date=${new Date().toISOString().slice(0, 10)}`}
                      className="group bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900 dark:text-white">{r.origin.city}</span>
                          <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                          <span className="text-lg font-black text-slate-900 dark:text-white">{r.destination.city}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-4 line-clamp-1">
                        {r.origin.name} → {r.destination.name}
                      </p>

                      <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Başlangıç</p>
                          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">₺{r.price}</p>
                        </div>
                        {r.nextDeparture && (
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1 justify-end">
                              <Clock className="w-2.5 h-2.5" /> İlk sefer
                            </p>
                            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">{fDate(r.nextDeparture)}</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </main>

      {/* CTA Footer */}
      <section className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Aradığın rotayı bulamadın mı?</h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium mb-6">Anasayfadan şehir-şehir arama yap veya bizimle iletişime geç.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold text-sm">
              <Search className="w-4 h-4" /> Sefer Ara
            </Link>
            <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800">
              İletişim
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
