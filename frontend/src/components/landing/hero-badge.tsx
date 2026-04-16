'use client';

import { useEffect, useState } from 'react';

interface Stats {
  newRoutes30d?: number;
  newCities30d?: number;
  routes?: number;
  upcomingTrips?: number;
}

export function HeroBadge() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/routes/public/stats`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  const newRoutes = stats?.newRoutes30d ?? 0;
  const newCities = stats?.newCities30d ?? 0;
  const upcoming = stats?.upcomingTrips ?? 0;

  // Prefer "new routes/cities" framing if anything was added in last 30 days,
  // otherwise fall back to a live trip count. Hide entirely if we have no data.
  let label: string;
  if (newRoutes > 0 && newCities > 0) {
    label = `${newRoutes} yeni rota · ${newCities} yeni şehir`;
  } else if (newRoutes > 0) {
    label = `Son 30 günde ${newRoutes} yeni rota`;
  } else if (newCities > 0) {
    label = `Son 30 günde ${newCities} yeni şehir`;
  } else if (upcoming > 0) {
    label = `${upcoming.toLocaleString('tr-TR')} sefer canlı`;
  } else {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-zinc-600 dark:text-zinc-300 text-xs font-bold mb-8 scale-95 select-none">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        Güvenli ve Hızlı Rezervasyon
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-zinc-600 dark:text-zinc-300 text-xs font-bold mb-8 scale-95 select-none">
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
      {label}
    </div>
  );
}
