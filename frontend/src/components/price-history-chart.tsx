"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import api from "@/lib/api";

interface HistoryPoint {
  date: string;
  min: number;
  avg: number;
  max: number;
  count: number;
}

interface PriceHistoryData {
  origin: string;
  destination: string;
  history: HistoryPoint[];
  summary: {
    avgPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    currentMin: number | null;
    verdict: 'GOOD' | 'AVERAGE' | 'EXPENSIVE' | 'UNKNOWN';
    sampleSize: number;
    days: number;
  };
}

interface Props {
  from: string;
  to: string;
  days?: number;
}

const VERDICT_META: Record<string, { label: string; color: string; icon: any }> = {
  GOOD: { label: 'İyi Fiyat', color: 'emerald', icon: TrendingDown },
  AVERAGE: { label: 'Ortalama', color: 'slate', icon: Minus },
  EXPENSIVE: { label: 'Yüksek', color: 'rose', icon: TrendingUp },
  UNKNOWN: { label: 'Veri Yetersiz', color: 'slate', icon: BarChart3 },
};

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
  slate: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
};

export function PriceHistoryChart({ from, to, days = 30 }: Props) {
  const [data, setData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/price-history', { params: { from, to, days } });
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, days]);

  if (loading) return <div className="skeleton-shimmer h-48 rounded-2xl" />;
  if (!data || data.summary.sampleSize === 0) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-900/40 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-6 text-center">
        <BarChart3 className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Bu rota için henüz fiyat geçmişi yok</p>
      </div>
    );
  }

  const verdict = VERDICT_META[data.summary.verdict];
  const VerdictIcon = verdict.icon;

  const allPrices = data.history.flatMap((h) => [h.min, h.max]);
  const chartMax = Math.max(...allPrices) * 1.1;
  const chartMin = Math.min(...allPrices) * 0.9;
  const range = chartMax - chartMin || 1;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white mb-0.5">Fiyat Geçmişi</p>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-widest">
            Son {days} gün · {data.summary.sampleSize} satış verisi
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${COLOR_CLASSES[verdict.color]}`}>
          <VerdictIcon className="w-3 h-3" /> {verdict.label}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="text-center p-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-0.5">En Düşük</p>
          <p className="text-base font-black tracking-tighter text-slate-900 dark:text-white">₺{data.summary.minPrice?.toLocaleString('tr-TR')}</p>
        </div>
        <div className="text-center p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-0.5">Ortalama</p>
          <p className="text-base font-black tracking-tighter text-indigo-700 dark:text-indigo-300">₺{data.summary.avgPrice?.toLocaleString('tr-TR')}</p>
        </div>
        <div className="text-center p-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-0.5">En Yüksek</p>
          <p className="text-base font-black tracking-tighter text-slate-900 dark:text-white">₺{data.summary.maxPrice?.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="relative h-24">
        <svg className="w-full h-full" viewBox={`0 0 ${data.history.length * 20} 100`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {data.history.length > 1 && (
            <>
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2"
                strokeLinecap="round"
                d={data.history
                  .map((p, i) => {
                    const x = i * 20;
                    const y = 100 - ((p.avg - chartMin) / range) * 100;
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}
              />
              <path
                fill="url(#priceGradient)"
                d={
                  data.history
                    .map((p, i) => {
                      const x = i * 20;
                      const y = 100 - ((p.avg - chartMin) / range) * 100;
                      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                    })
                    .join(' ') + ` L${(data.history.length - 1) * 20},100 L0,100 Z`
                }
              />
            </>
          )}
          {/* Current price marker line */}
          {data.summary.currentMin !== null && (
            <line
              x1="0"
              x2={data.history.length * 20}
              y1={100 - ((data.summary.currentMin - chartMin) / range) * 100}
              y2={100 - ((data.summary.currentMin - chartMin) / range) * 100}
              stroke="rgb(16, 185, 129)"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          )}
        </svg>
      </div>

      {/* Current marker legend */}
      {data.summary.currentMin !== null && (
        <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-500 rounded" />
            Şu anki en düşük: <strong className="text-emerald-600 dark:text-emerald-400">₺{data.summary.currentMin.toLocaleString('tr-TR')}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
