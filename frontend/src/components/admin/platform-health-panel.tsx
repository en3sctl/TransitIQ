"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Activity, Database, Mail, CreditCard, HardDrive, Cpu, CheckCircle2, AlertTriangle, XCircle, Server, Clock, Users } from "lucide-react";
import api from "@/lib/api";
import { useVisibleInterval } from "@/lib/use-visible-interval";

interface Check {
  name: string;
  status: 'OK' | 'WARN' | 'FAIL';
  latencyMs?: number;
  detail?: string;
}
interface Health {
  overall: 'HEALTHY' | 'WARNING' | 'DEGRADED';
  uptimeSeconds: number;
  timestamp: string;
  node: { version: string; platform: string; arch: string; cpus: number; memoryTotalGb: number };
  checks: Check[];
  business: {
    bookingsLast24h: number;
    failedRefundsLast24h: number;
    activeTrips: number;
    pendingComplaints: number;
    openDataRequests: number;
  };
}

function fmtUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}g ${h}s ${m}d`;
  if (h > 0) return `${h}s ${m}d`;
  return `${m}d`;
}

const CHECK_ICONS: Record<string, any> = {
  'PostgreSQL': Database,
  'Resend (E-posta)': Mail,
  'Iyzico (Ödeme)': CreditCard,
  'Uploads Dizini': HardDrive,
  'Memory (Node heap)': Cpu,
};

const OVERALL_TONE: Record<string, { bg: string; label: string; icon: any }> = {
  HEALTHY: { bg: 'bg-emerald-600', label: 'Sağlıklı', icon: CheckCircle2 },
  WARNING: { bg: 'bg-amber-500', label: 'Uyarı', icon: AlertTriangle },
  DEGRADED: { bg: 'bg-rose-600', label: 'Sorunlu', icon: XCircle },
};

export function PlatformHealthPanel() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/super-admin/health');
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { load(); }, []);
  useVisibleInterval(() => load(true), 30000);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!data) return <div className="text-center text-rose-500 font-bold py-10">Sistem durumu alınamadı</div>;

  const tone = OVERALL_TONE[data.overall];
  const OverallIcon = tone.icon;

  return (
    <div className="space-y-5">
      {/* Overall card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${tone.bg} text-white rounded-3xl p-6 flex items-center gap-5 relative overflow-hidden`}>
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
          <OverallIcon className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Platform Durumu</p>
          <p className="text-3xl font-black tracking-tight">{tone.label}</p>
          <p className="text-[11px] font-semibold opacity-80 mt-1 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Uptime: {fmtUptime(data.uptimeSeconds)}</span>
            <span className="inline-flex items-center gap-1"><Server className="w-3 h-3" /> Node {data.node.version} · {data.node.cpus} CPU</span>
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </motion.div>

      {/* Service checks */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Servis Durumları
        </h3>
        <div className="space-y-2">
          {data.checks.map((c) => {
            const Icon = CHECK_ICONS[c.name] || Activity;
            return (
              <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                  {c.detail && <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">{c.detail}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.latencyMs !== undefined && (
                    <span className="text-[10px] font-bold text-slate-400">{c.latencyMs}ms</span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    c.status === 'OK' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                    c.status === 'WARN' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                    'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  }`}>
                    {c.status === 'OK' ? <CheckCircle2 className="w-2.5 h-2.5" /> : c.status === 'WARN' ? <AlertTriangle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                    {c.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Business pulse */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> İş Metrikleri (24 saat)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <PulseTile label="Bilet (24s)" value={data.business.bookingsLast24h} tone="emerald" />
          <PulseTile label="Başarısız İade" value={data.business.failedRefundsLast24h} tone="rose" />
          <PulseTile label="Aktif Sefer" value={data.business.activeTrips} tone="indigo" />
          <PulseTile label="Açık Şikayet" value={data.business.pendingComplaints} tone="amber" />
          <PulseTile label="KVKK Talep" value={data.business.openDataRequests} tone="purple" />
        </div>
      </div>
    </div>
  );
}

function PulseTile({ label, value, tone }: any) {
  const toneMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
      <p className={`text-2xl font-black tracking-tight mt-1 tabular-nums ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}
