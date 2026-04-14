"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Car, Plane, TrainFront, Bus } from "lucide-react";
import api from "@/lib/api";

interface CarbonData {
  distanceKm: number;
  bus: number;
  car: number;
  plane: number;
  train: number;
  savedVsCar: number;
  savedVsPlane: number;
  percentLessThanCar: number;
  percentLessThanPlane: number;
  equivalent: string;
}

interface Props {
  distanceKm: number | null | undefined;
  compact?: boolean;
}

export function CarbonFootprint({ distanceKm, compact = false }: Props) {
  const [data, setData] = useState<CarbonData | null>(null);

  useEffect(() => {
    if (!distanceKm || distanceKm <= 0) {
      setData(null);
      return;
    }
    (async () => {
      try {
        const res = await api.get('/carbon', { params: { distanceKm } });
        setData(res.data);
      } catch {
        setData(null);
      }
    })();
  }, [distanceKm]);

  if (!data) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
        <Leaf className="w-3 h-3" />
        {data.bus.toFixed(1)} kg CO₂ · %{data.percentLessThanCar} daha az
      </div>
    );
  }

  const modes = [
    { icon: Bus, label: 'Otobüs', value: data.bus, highlight: true, color: 'emerald' },
    { icon: TrainFront, label: 'Tren', value: data.train, color: 'slate' },
    { icon: Car, label: 'Araba', value: data.car, color: 'amber' },
    { icon: Plane, label: 'Uçak', value: data.plane, color: 'rose' },
  ];
  const max = Math.max(...modes.map((m) => m.value));

  const COLORS: Record<string, string> = {
    emerald: 'bg-emerald-500',
    slate: 'bg-slate-400',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Çevresel Etki</p>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{data.distanceKm} km yolculuk</p>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-2.5 mb-4">
        {modes.map((m) => {
          const Icon = m.icon;
          const width = max > 0 ? (m.value / max) * 100 : 0;
          return (
            <div key={m.label} className={`flex items-center gap-3 ${m.highlight ? '' : 'opacity-70'}`}>
              <div className="w-16 flex items-center gap-1.5 shrink-0">
                <Icon className={`w-3.5 h-3.5 ${m.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${m.highlight ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                  {m.label}
                </span>
              </div>
              <div className="flex-1 h-5 bg-white dark:bg-zinc-900 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${COLORS[m.color]} rounded-full`}
                />
              </div>
              <span className={`text-xs font-black tabular-nums w-14 text-right ${m.highlight ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-zinc-300'}`}>
                {m.value.toFixed(1)} kg
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-0.5">
            Uçağa göre %{data.percentLessThanPlane} az
          </p>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">{data.equivalent}</p>
        </div>
      </div>
    </motion.div>
  );
}
