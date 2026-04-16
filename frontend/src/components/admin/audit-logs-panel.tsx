"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  History, User, Ticket, Bus, MapPin, Calendar, Trash2, Edit2, UserPlus,
  CheckCircle2, XCircle, RotateCcw, RefreshCw, Loader2, ShieldAlert, Search, Download,
} from "lucide-react";
import api from "@/lib/api";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  timestamp: string;
  user: { id: string; name: string; email: string; role: string } | null;
}

const ACTION_META: Record<string, { label: string; icon: any; color: string }> = {
  BOOKING_CANCEL: { label: 'Bilet İptal', icon: XCircle, color: 'rose' },
  BOOKING_REFUND: { label: 'Bilet İade', icon: RotateCcw, color: 'indigo' },
  TRIP_REASSIGN_DRIVER: { label: 'Şoför Değişimi', icon: RefreshCw, color: 'amber' },
  TRIP_REASSIGN_VEHICLE: { label: 'Araç Değişimi', icon: RefreshCw, color: 'amber' },
  TRIP_STATUS_CHANGE: { label: 'Sefer Durumu', icon: Edit2, color: 'slate' },
  DRIVER_CREATE: { label: 'Şoför Eklendi', icon: UserPlus, color: 'emerald' },
  DRIVER_UPDATE: { label: 'Şoför Güncellendi', icon: Edit2, color: 'slate' },
  DRIVER_DELETE: { label: 'Şoför Silindi', icon: Trash2, color: 'rose' },
  PASSENGER_CHECK_IN: { label: 'Yolcu Check-in', icon: CheckCircle2, color: 'emerald' },
  PASSENGER_NO_SHOW: { label: 'Gelmedi İşareti', icon: XCircle, color: 'rose' },
};

const ENTITY_ICONS: Record<string, any> = {
  BOOKING: Ticket,
  TRIP: Bus,
  DRIVER: User,
  VEHICLE: Bus,
  STATION: MapPin,
  ROUTE: MapPin,
};

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
};

function fDateTime(s: string) {
  const d = new Date(s);
  return `${d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  const d = Math.floor(h / 24);
  return `${d}g önce`;
}

export function AdminAuditLogsPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const TAKE = 25;

  useEffect(() => { load(); }, [filter, skip]);

  async function load() {
    setLoading(true);
    try {
      const params: any = { take: TAKE, skip };
      if (filter) params.entityType = filter;
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200/80 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Denetim Kayıtları</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const headers = ['Tarih', 'İşlem', 'Varlık', 'Kullanıcı', 'Detay'];
                const rows = logs.map(l => {
                  const meta = ACTION_META[l.action] || { label: l.action };
                  return [fDateTime(l.timestamp), meta.label, l.entityType, l.user?.name || 'sistem', l.entityId.slice(0, 8)];
                });
                const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `denetim_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                toast.success('CSV indirildi');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{total} kayıt</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input type="text" placeholder="Kullanıcı, işlem veya ID ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: '', label: 'Tümü' },
            { value: 'BOOKING', label: 'Biletler' },
            { value: 'TRIP', label: 'Seferler' },
            { value: 'DRIVER', label: 'Şoförler' },
            { value: 'VEHICLE', label: 'Araçlar' },
            { value: 'STATION', label: 'İstasyonlar' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setSkip(0); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-10 flex justify-center">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center">
          <History className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Henüz kayıt yok</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {logs.filter(log => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            const meta = ACTION_META[log.action] || { label: log.action };
            return (
              meta.label.toLowerCase().includes(q) ||
              log.entityType.toLowerCase().includes(q) ||
              log.entityId.toLowerCase().includes(q) ||
              (log.user?.name || '').toLowerCase().includes(q) ||
              (log.user?.email || '').toLowerCase().includes(q)
            );
          }).map((log) => {
            const meta = ACTION_META[log.action] || { label: log.action, icon: History, color: 'slate' };
            const ActionIcon = meta.icon;
            const EntityIcon = ENTITY_ICONS[log.entityType] || Ticket;

            return (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${COLOR_CLASSES[meta.color]}`}>
                  <ActionIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{meta.label}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                      <EntityIcon className="w-2.5 h-2.5" /> {log.entityType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex-wrap">
                    {log.user ? (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" /> {log.user.name}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">sistem</span>
                    )}
                    <span>·</span>
                    <span className="font-mono text-[10px]">{log.entityId.slice(0, 8)}</span>
                    <span>·</span>
                    <span title={fDateTime(log.timestamp)}>{timeAgo(log.timestamp)}</span>
                  </div>
                  {(log.oldValues || log.newValues) && (
                    <details className="mt-2">
                      <summary className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                        Detayları göster
                      </summary>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {log.oldValues && (
                          <div className="p-2.5 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-lg">
                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1">Önce</p>
                            <pre className="text-[10px] text-slate-700 dark:text-zinc-300 font-mono whitespace-pre-wrap break-all">
                              {JSON.stringify(log.oldValues, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValues && (
                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-lg">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Sonra</p>
                            <pre className="text-[10px] text-slate-700 dark:text-zinc-300 font-mono whitespace-pre-wrap break-all">
                              {JSON.stringify(log.newValues, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > TAKE && (
        <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-200/80 dark:border-zinc-800">
          <button
            onClick={() => setSkip(Math.max(0, skip - TAKE))}
            disabled={skip === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-bold disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Önceki
          </button>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
            {skip + 1}-{Math.min(skip + TAKE, total)} / {total}
          </p>
          <button
            onClick={() => setSkip(skip + TAKE)}
            disabled={skip + TAKE >= total}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-bold disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
