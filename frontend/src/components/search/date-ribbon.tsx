'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Day {
  date: string;
  tripCount: number;
  minPrice: number | null;
  availableSeats: number;
}

interface Props {
  from: string;
  to: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function shiftDate(d: string, days: number): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function isPast(date: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

export function DateRibbon({ from, to, selectedDate, onSelectDate }: Props) {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(false);
  const [centerDate, setCenterDate] = useState(selectedDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Re-center when user picks a date outside the current strip
  useEffect(() => {
    const inStrip = days.some((d) => d.date === selectedDate);
    if (!inStrip) setCenterDate(selectedDate);
  }, [selectedDate, days]);

  useEffect(() => {
    if (!from || !to || !centerDate) return;
    let aborted = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/booking/search/price-strip', {
          params: { from, to, date: centerDate, days: 7 },
        });
        if (!aborted) setDays(res.data || []);
      } catch {
        if (!aborted) setDays([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [from, to, centerDate]);

  const minOfAll = useMemo(() => {
    // Only consider days that have available seats — a "cheapest day" marker
    // is useless if that day is fully sold.
    const prices = days
      .filter((d) => d.availableSeats > 0 && d.minPrice !== null)
      .map((d) => d.minPrice as number);
    return prices.length ? Math.min(...prices) : null;
  }, [days]);

  const shiftWindow = (delta: number) => {
    setCenterDate(shiftDate(centerDate, delta));
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => shiftWindow(-7)}
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Önceki hafta"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex-1 flex items-stretch gap-1.5 overflow-x-auto scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading && days.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : (
          days.map((d) => {
            const dt = new Date(d.date);
            const isSelected = d.date === selectedDate;
            const past = isPast(d.date);
            const hasTrips = d.tripCount > 0;
            const isFull = hasTrips && d.availableSeats === 0;
            const isCheapest = !isFull && minOfAll != null && d.minPrice === minOfAll;

            return (
              <button
                key={d.date}
                type="button"
                disabled={past}
                onClick={() => !past && onSelectDate(d.date)}
                className={`snap-start shrink-0 min-w-[86px] flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : past
                    ? 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 text-slate-300 dark:text-zinc-600 cursor-not-allowed'
                    : isFull
                    ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 hover:border-amber-400 text-amber-700 dark:text-amber-400'
                    : hasTrips
                    ? 'border-slate-200 dark:border-zinc-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 text-slate-700 dark:text-zinc-200'
                    : 'border-slate-100 dark:border-zinc-900 text-slate-400 dark:text-zinc-600 hover:border-slate-300'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-white/80' : ''}`}>
                  {DAY_SHORT[dt.getDay()]}
                </span>
                <span className="text-sm font-black tracking-tight">
                  {dt.getDate()} {MONTH_SHORT[dt.getMonth()]}
                </span>
                {past ? (
                  <span className="text-[10px] font-semibold">—</span>
                ) : isFull ? (
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                    Dolu
                  </span>
                ) : d.minPrice != null ? (
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected
                        ? 'text-white'
                        : isCheapest
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    ₺{d.minPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </span>
                ) : (
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                    Sefer yok
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => shiftWindow(7)}
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Sonraki hafta"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
