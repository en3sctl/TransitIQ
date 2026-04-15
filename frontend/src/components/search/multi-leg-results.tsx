"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Bus, Hourglass, Coffee, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface LegTrip {
  id: string;
  departureTime: string;
  estimatedArrival: string | null;
  origin: string;
  destination: string;
  originStation: string;
  destinationStation: string;
  price: number;
  availableSeats: number;
  busModel: string;
}

interface MultiLegOption {
  hub: string;
  leg1: LegTrip;
  leg2: LegTrip;
  totalPrice: number;
  transferMinutes: number;
  totalDurationMinutes: number;
}

interface Props {
  from: string;
  to: string;
  date: string;
  onSelectTrip: (tripId: string) => void;
}

function fTime(s: string) {
  return new Date(s).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function fDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}sa${m > 0 ? ` ${m}dk` : ''}`;
}

export function MultiLegResults({ from, to, date, onSelectTrip }: Props) {
  const [options, setOptions] = useState<MultiLegOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to || !date) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/booking/search/multi-leg', { params: { from, to, date } });
        setOptions(res.data || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, date]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-3 text-sm font-bold text-slate-500 dark:text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Aktarmalı seçenekler aranıyor...
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
          <Hourglass className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-black text-amber-900 dark:text-amber-200 mb-0.5">Direkt sefer yok ama aktarmalı gidebilirsin</p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300/80 font-medium">
            {options.length} farklı aktarma seçeneği bulundu. Her ayak için ayrı bilet almalısın.
          </p>
        </div>
      </div>

      {options.map((opt, i) => (
        <motion.div
          key={`${opt.leg1.id}-${opt.leg2.id}`}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {opt.leg1.origin}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                <Coffee className="w-2.5 h-2.5" /> {opt.hub}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {opt.leg2.destination}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Toplam</p>
              <p className="text-xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 leading-none">
                ₺{opt.totalPrice.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>

          {/* Legs */}
          <div className="space-y-3">
            {/* Leg 1 */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black">1</span>
              <div className="flex-1 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">{opt.leg1.origin}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{fTime(opt.leg1.departureTime)}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{opt.leg1.destination}</span>
                  {opt.leg1.estimatedArrival && (
                    <span className="text-[10px] font-semibold text-slate-400">{fTime(opt.leg1.estimatedArrival)}</span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                  <Bus className="w-2.5 h-2.5" /> {opt.leg1.availableSeats} koltuk
                </span>
              </div>
              <button
                onClick={() => onSelectTrip(opt.leg1.id)}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest"
              >
                ₺{opt.leg1.price} Al
              </button>
            </div>

            {/* Transfer */}
            <div className="flex items-center gap-2 px-3 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              <Clock className="w-3 h-3" />
              <span>{opt.hub}'ta <strong>{fDuration(opt.transferMinutes)}</strong> aktarma beklemesi</span>
            </div>

            {/* Leg 2 */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black">2</span>
              <div className="flex-1 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">{opt.leg2.origin}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{fTime(opt.leg2.departureTime)}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{opt.leg2.destination}</span>
                  {opt.leg2.estimatedArrival && (
                    <span className="text-[10px] font-semibold text-slate-400">{fTime(opt.leg2.estimatedArrival)}</span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                  <Bus className="w-2.5 h-2.5" /> {opt.leg2.availableSeats} koltuk
                </span>
              </div>
              <button
                onClick={() => onSelectTrip(opt.leg2.id)}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest"
              >
                ₺{opt.leg2.price} Al
              </button>
            </div>
          </div>

          {/* Total duration */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Toplam yolculuk: <strong className="text-slate-900 dark:text-white">{fDuration(opt.totalDurationMinutes)}</strong>
            </span>
            <span>2 ayrı bilet alınacak</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
