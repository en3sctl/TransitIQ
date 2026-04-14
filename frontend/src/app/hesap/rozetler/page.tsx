"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Ticket, Bus, Compass, Trophy, MapPin, Calendar, Sunrise, Moon,
  Award, Lock, CheckCircle2,
} from "lucide-react";
import { AccountLayout } from "@/components/hesap/account-layout";
import api from "@/lib/api";

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  earned: boolean;
}

interface BadgesResponse {
  totalTrips: number;
  badges: Badge[];
}

const ICON_MAP: Record<string, any> = {
  Ticket, Bus, Compass, Trophy, MapPin, Calendar, Sunrise, Moon,
};

const TIER_STYLES: Record<string, { gradient: string; ring: string; label: string }> = {
  bronze: { gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-200 dark:ring-amber-900/40', label: 'Bronz' },
  silver: { gradient: 'from-slate-300 to-slate-500', ring: 'ring-slate-200 dark:ring-slate-700/40', label: 'Gümüş' },
  gold: { gradient: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-200 dark:ring-yellow-900/40', label: 'Altın' },
};

export default function BadgesPage() {
  const [data, setData] = useState<BadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/badges');
        setData(res.data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const earnedCount = data?.badges.filter((b) => b.earned).length || 0;
  const totalCount = data?.badges.length || 0;
  const progress = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <AccountLayout title="Rozetlerim" subtitle="Her yolculuk yeni bir hikaye. Rozetlerin seni özetler.">
      {/* Hero stats — editorial, no oversaturated gradient */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 mb-6"
      >
        <div className="grid grid-cols-3 gap-5 mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">Rozet</p>
            <p className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
              {earnedCount}<span className="text-xl text-slate-300 dark:text-zinc-600">/{totalCount}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">Toplam Sefer</p>
            <p className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{data?.totalTrips || 0}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">İlerleme</p>
            <p className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">%{Math.round(progress)}</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Badges grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton-shimmer h-44 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data?.badges.map((badge, i) => {
            const Icon = ICON_MAP[badge.icon] || Trophy;
            const style = TIER_STYLES[badge.tier];
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`relative bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 text-center overflow-hidden ${
                  badge.earned ? '' : 'opacity-60'
                }`}
              >
                {badge.earned && (
                  <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
                {!badge.earned && (
                  <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-3 ring-4 ${style.ring} ${badge.earned ? 'shadow-lg' : 'grayscale'}`}>
                  <Icon className="w-8 h-8 text-white drop-shadow" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{style.label}</p>
                <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white mb-1">{badge.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">{badge.description}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
