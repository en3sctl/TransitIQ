"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Activity, Clock, Bus, ShieldCheck, Calendar,
  TrendingUp, ArrowRight, Loader2, Users, Ticket, MapPin, Zap, Bell,
  History, RotateCcw,
} from "lucide-react";
import api from "@/lib/api";

interface Overview {
  today: { bookings: number; revenue: number };
  trips: { active: number; plannedToday: number };
  alerts: {
    failedRefunds: number;
    expiredVehicles: { id: string; plate: string; muayeneExpired: boolean; sigortaExpired: boolean }[];
    expiringVehicles: { id: string; plate: string; muayene: string | null; sigorta: string | null }[];
  };
  upcomingTrips: {
    id: string; origin: string; destination: string; departureTime: string;
    plate: string; driver: string | null; status: string; bookings: number;
  }[];
  recentActivity: {
    id: string; action: string; entityType: string; userName: string | null; timestamp: string;
  }[];
}

const ACTION_LABELS: Record<string, string> = {
  BOOKING_CANCEL: 'Bilet iptal edildi',
  BOOKING_REFUND: 'Bilet iade edildi',
  TRIP_REASSIGN_DRIVER: 'Şoför değiştirildi',
  TRIP_REASSIGN_VEHICLE: 'Araç değiştirildi',
  DRIVER_CREATE: 'Şoför eklendi',
  DRIVER_UPDATE: 'Şoför güncellendi',
  DRIVER_DELETE: 'Şoför silindi',
  CREATE: 'Oluşturuldu',
  UPDATE: 'Güncellendi',
  DELETE: 'Silindi',
};

const ENTITY_LABELS: Record<string, string> = {
  BOOKING: 'bilet', TRIP: 'sefer', DRIVER: 'şoför',
  VEHICLE: 'araç', STATION: 'istasyon', ROUTE: 'rota',
};

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

function fDateTime(s: string) {
  const d = new Date(s);
  return `${d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function SystemOverview({ onNavigate, refreshKey }: { onNavigate?: (tab: string) => void; refreshKey?: number }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/analytics/overview')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-sm font-bold text-zinc-500">Veriler yüklenemedi</div>;
  }

  const totalAlerts = data.alerts.failedRefunds + data.alerts.expiredVehicles.length;
  const totalWarnings = data.alerts.expiringVehicles.length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Today at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PulseCard icon={Ticket} label="Bugün Satılan Bilet" value={data.today.bookings.toString()} accent={data.today.bookings > 0 ? 'emerald' : 'zinc'} />
        <PulseCard icon={TrendingUp} label="Bugünkü Gelir" value={`₺${data.today.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} accent="indigo" />
        <PulseCard icon={Activity} label="Aktif Sefer" value={data.trips.active.toString()} accent={data.trips.active > 0 ? 'emerald' : 'zinc'} pulse={data.trips.active > 0} />
        <PulseCard icon={Calendar} label="Bugün Planlı Sefer" value={data.trips.plannedToday.toString()} accent="amber" />
      </div>

      {/* Critical Alerts */}
      {(totalAlerts > 0 || totalWarnings > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Critical */}
          {totalAlerts > 0 && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-black text-rose-900 dark:text-rose-300 uppercase tracking-widest">Acil Müdahale</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">{totalAlerts}</span>
              </div>
              <div className="space-y-2">
                {data.alerts.failedRefunds > 0 && (
                  <button onClick={() => onNavigate?.('bookings')} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors group">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{data.alerts.failedRefunds} iade başarısız oldu</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                {data.alerts.expiredVehicles.slice(0, 3).map(v => (
                  <button key={v.id} onClick={() => onNavigate?.('vehicles')} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors group">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{v.plate} — {v.muayeneExpired && v.sigortaExpired ? 'Muayene + Sigorta' : v.muayeneExpired ? 'Muayene' : 'Sigorta'} süresi geçmiş</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {totalWarnings > 0 && (
            <div className={`${totalAlerts === 0 ? 'lg:col-span-2' : ''} bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest">Yaklaşan Son Tarihler</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black">{totalWarnings}</span>
              </div>
              <div className="space-y-2">
                {data.alerts.expiringVehicles.slice(0, 4).map(v => {
                  const days = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
                  const muayeneDays = days(v.muayene);
                  const sigortaDays = days(v.sigorta);
                  const nearest = [muayeneDays, sigortaDays].filter((d): d is number => d !== null && d >= 0).sort((a, b) => a - b)[0];
                  return (
                    <button key={v.id} onClick={() => onNavigate?.('vehicles')} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors group">
                      <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{v.plate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">{nearest} gün</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Everything is OK banner */}
      {totalAlerts === 0 && totalWarnings === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-emerald-900 dark:text-emerald-300">Tüm sistemler çalışıyor</p>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Acil müdahale gerektiren bir durum yok.</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <QuickAction icon={Calendar} label="Sefer Oluştur" onClick={() => onNavigate?.('trips')} color="indigo" />
        <QuickAction icon={Bus} label="Araç Ekle" onClick={() => onNavigate?.('vehicles')} color="emerald" />
        <QuickAction icon={Ticket} label="Biletler" onClick={() => onNavigate?.('bookings')} color="amber" />
        <QuickAction icon={TrendingUp} label="Ciro & Analiz" onClick={() => onNavigate?.('revenue')} color="rose" />
        <QuickAction icon={Users} label="Şoförler" onClick={() => onNavigate?.('drivers')} color="zinc" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Trips */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Yaklaşan Seferler</h3>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Sıradaki 6 sefer</p>
            </div>
            <button onClick={() => onNavigate?.('trips')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Tümünü Gör →</button>
          </div>
          {data.upcomingTrips.length === 0 ? (
            <p className="p-10 text-sm text-zinc-400 text-center font-semibold">Yaklaşan sefer yok</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.upcomingTrips.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{t.origin} <span className="text-indigo-500 mx-1">→</span> {t.destination}</span>
                      {t.status === 'ACTIVE' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">Yolda</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>{fDateTime(t.departureTime)}</span>
                      <span>•</span>
                      <span>{t.plate}</span>
                      {t.driver && <><span>•</span><span>{t.driver}</span></>}
                    </p>
                  </div>
                  <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 tabular-nums shrink-0">
                    <span className="text-indigo-500">{t.bookings}</span>
                    <span className="text-zinc-400 text-[10px] font-semibold ml-1">bilet</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Son Aktiviteler</h3>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Canlı denetim akışı</p>
            </div>
            <button onClick={() => onNavigate?.('audit')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Tümü →</button>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="p-10 text-sm text-zinc-400 text-center font-semibold">Henüz aktivite yok</p>
          ) : (
            <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
              {data.recentActivity.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">
                      {ACTION_LABELS[l.action] || l.action} <span className="text-zinc-400">·</span> <span className="text-zinc-500">{ENTITY_LABELS[l.entityType] || l.entityType}</span>
                    </p>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                      {l.userName || 'Sistem'} · {timeAgo(l.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PulseCard({ icon: Icon, label, value, accent, pulse }: { icon: any; label: string; value: string; accent: string; pulse?: boolean }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
      {pulse && (
        <div className="absolute top-3 right-3">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <span className="relative rounded-full bg-emerald-500 w-2 h-2" />
          </span>
        </div>
      )}
      <div className={`w-10 h-10 rounded-xl ${cls[accent]} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, color }: { icon: any; label: string; onClick: () => void; color: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
  };
  return (
    <button onClick={onClick} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group text-left">
      <div className={`w-9 h-9 rounded-xl ${cls[color]} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-bold text-zinc-900 dark:text-white">{label}</span>
    </button>
  );
}
