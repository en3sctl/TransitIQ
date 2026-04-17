"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Loader2, Mail, Phone, Users as UsersIcon, Clock, MailCheck, Check, XCircle, Search, Filter } from "lucide-react";
import api from "@/lib/api";

interface Entry {
  id: string;
  status: string;
  passengerCount: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  notifiedAt: string | null;
  notifyCount: number;
  createdAt: string;
  trip: { id: string; departureTime: string; origin: string; destination: string } | null;
}

interface Stats {
  waiting: number;
  notified: number;
  converted: number;
  expired: number;
  cancelled: number;
}

const STATUS_META: Record<string, { label: string; tone: string; icon: any }> = {
  WAITING: { label: 'Sırada', tone: 'slate', icon: Clock },
  NOTIFIED: { label: 'Bildirildi', tone: 'emerald', icon: MailCheck },
  CONVERTED: { label: 'Rezerve', tone: 'indigo', icon: Check },
  EXPIRED: { label: 'Geçti', tone: 'amber', icon: XCircle },
  CANCELLED: { label: 'İptal', tone: 'rose', icon: XCircle },
};
const TONE_CLASS: Record<string, string> = {
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

export function WaitingListPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<Stats>({ waiting: 0, notified: 0, converted: 0, expired: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/waiting-list', {
        params: { status: statusFilter || undefined, take: 100 },
      });
      setEntries(res.data?.entries || []);
      setStats(res.data?.stats || stats);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      e.contactName.toLowerCase().includes(q) ||
      e.contactEmail.toLowerCase().includes(q) ||
      (e.contactPhone || '').includes(q) ||
      (e.trip?.origin || '').toLowerCase().includes(q) ||
      (e.trip?.destination || '').toLowerCase().includes(q),
    );
  }, [entries, searchQuery]);

  const statTiles = [
    { key: 'waiting', label: 'Sırada', value: stats.waiting, tone: 'slate' },
    { key: 'notified', label: 'Bildirildi', value: stats.notified, tone: 'emerald' },
    { key: 'converted', label: 'Rezerve', value: stats.converted, tone: 'indigo' },
    { key: 'expired', label: 'Geçti', value: stats.expired, tone: 'amber' },
    { key: 'cancelled', label: 'İptal', value: stats.cancelled, tone: 'rose' },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statTiles.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key.toUpperCase() ? '' : s.key.toUpperCase())}
            className={`text-left p-4 rounded-2xl border transition-all ${
              statusFilter === s.key.toUpperCase()
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-900'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${TONE_CLASS[s.tone]}`.replace('bg-', 'text-').split(' ')[0] + ' ' + 'opacity-80'}>{s.label}</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, e-posta, telefon veya şehir ile ara..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
          />
        </div>
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700"
          >
            <Filter className="w-3 h-3" /> Filtreyi temizle
          </button>
        )}
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
        >
          Yenile
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <BellRing className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
            {searchQuery || statusFilter ? 'Filtreye uyan kayıt yok' : 'Henüz bekleme listesi kaydı yok'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {filtered.map((e, i) => {
              const meta = STATUS_META[e.status] || STATUS_META.WAITING;
              const StatusIcon = meta.icon;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${TONE_CLASS[meta.tone]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                        <UsersIcon className="w-3 h-3" />
                        {e.passengerCount}
                      </span>
                      {e.notifyCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <MailCheck className="w-3 h-3" />
                          {e.notifyCount}× bildirildi
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {e.contactName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                        <Mail className="w-3 h-3" /> {e.contactEmail}
                      </span>
                      {e.contactPhone && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                          <Phone className="w-3 h-3" /> {e.contactPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-sm">
                    {e.trip ? (
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{e.trip.origin} → {e.trip.destination}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                          {new Date(e.trip.departureTime).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Sefer silinmiş</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
