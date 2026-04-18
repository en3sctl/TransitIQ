"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrafficCone, Car, Shield, CloudRain, Construction, AlertTriangle,
  ThumbsUp, ThumbsDown, CheckCircle2, X, Loader2, Plus, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Alert {
  id: string;
  reporterId: string;
  category: string;
  note: string | null;
  lat: number;
  lng: number;
  upvoteCount: number;
  downvoteCount: number;
  verifiedCount: number;
  createdAt: string;
  distanceKm: number;
}

const CAT_META: Record<string, { label: string; icon: any; color: string }> = {
  TRAFFIC: { label: 'Trafik', icon: TrafficCone, color: 'bg-amber-500' },
  ACCIDENT: { label: 'Kaza', icon: Car, color: 'bg-rose-500' },
  POLICE: { label: 'Polis', icon: Shield, color: 'bg-indigo-600' },
  WEATHER: { label: 'Hava', icon: CloudRain, color: 'bg-sky-500' },
  ROAD_WORK: { label: 'Yol Çalışması', icon: Construction, color: 'bg-orange-500' },
  HAZARD: { label: 'Tehlike', icon: AlertTriangle, color: 'bg-red-600' },
};

interface Props {
  coords: { lat: number; lng: number } | null;
  currentUserId: string | null;
}

export function RoadAlerts({ coords, currentUserId }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await api.get('/driver-ops/road-alerts/nearby', {
        params: { lat: coords.lat, lng: coords.lng, radius: 50 },
      });
      setAlerts(res.data || []);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [coords?.lat, coords?.lng]);

  // 5 dakikada bir yenile
  useEffect(() => {
    if (!coords) return;
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [coords?.lat, coords?.lng]);

  const createAlert = async (category: string, note?: string) => {
    if (!coords) { toast.error('Konum yok — GPS izni gerekli'); return; }
    try {
      await api.post('/driver-ops/road-alerts', {
        category,
        note: note || undefined,
        lat: coords.lat,
        lng: coords.lng,
      });
      toast.success('Yol uyarın yakındaki şoförlere iletildi');
      setShowCreate(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gönderilemedi');
    }
  };

  const vote = async (id: string, v: 'up' | 'down' | 'verify') => {
    try {
      await api.post(`/driver-ops/road-alerts/${id}/vote`, { vote: v });
      load();
    } catch { /* silent */ }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/driver-ops/road-alerts/${id}`);
      load();
    } catch { /* silent */ }
  };

  if (!coords) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            Yakındaki Yol Durumu
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
            {alerts.length} uyarı · 50 km çap · Şoförler bildiriyor
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          Uyarı Yayınla
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
                Ne var yolda?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CAT_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => createAlert(key)}
                      className={`${meta.color} text-white rounded-xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></div>
      ) : alerts.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium text-center py-6">
          Bu bölgede aktif uyarı yok — yol açık görünüyor.
        </p>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const meta = CAT_META[a.category] || CAT_META.HAZARD;
            const Icon = meta.icon;
            const ageMin = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 60000);
            const isOwn = a.reporterId === currentUserId;
            return (
              <div key={a.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${meta.color} text-white flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{meta.label}</p>
                      <span className="text-[10px] font-bold text-slate-400">
                        {a.distanceKm.toFixed(1)} km · {ageMin < 60 ? `${ageMin} dk önce` : `${Math.floor(ageMin / 60)} sa önce`}
                      </span>
                      {isOwn && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">Senin</span>}
                    </div>
                    {a.note && (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium italic mt-1">"{a.note}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {!isOwn ? (
                    <>
                      <button
                        onClick={() => vote(a.id, 'verify')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Ben de gördüm
                        {a.verifiedCount > 0 && <span className="ml-0.5">({a.verifiedCount})</span>}
                      </button>
                      <button
                        onClick={() => vote(a.id, 'up')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-zinc-700"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {a.upvoteCount > 0 && <span>{a.upvoteCount}</span>}
                      </button>
                      <button
                        onClick={() => vote(a.id, 'down')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-zinc-700"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        {a.downvoteCount > 0 && <span>{a.downvoteCount}</span>}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 font-bold">✓ {a.verifiedCount} teyit · 👍 {a.upvoteCount}</span>
                      <button
                        onClick={() => remove(a.id)}
                        className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <X className="w-3 h-3" /> Sil
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
