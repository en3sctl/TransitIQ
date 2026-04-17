"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, TrendingUp, TrendingDown, Users, Building2, Wallet, Percent, AlertTriangle, Clock, ShieldAlert, RotateCcw, ArrowUp, ArrowDown, Trophy } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Overview {
  tenants: { total: number; active: number; pending: number; suspended: number; newLast7: number };
  users: { total: number; newLast7: number };
  bookings: { total: number; confirmed: number };
  gmv: { all: number; today: number; last30: number; prev30: number; growthPct: number };
  commission: { all: number; last30: number };
  alerts: { pendingApprovals: number; pendingComplaints: number; failedRefunds: number };
  topTenants: Array<{
    tenant: { id: string; name: string; publicName: string | null; slug: string; logoUrl: string | null };
    bookingCount: number;
    revenue: number;
  }>;
  dailySeries: Array<{ date: string; revenue: number; count: number }>;
}

function fmtTry(v: number) {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺';
}
function fmtTryFull(v: number) {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }
function toAbs(u: string | null) { return u ? (u.startsWith('http') ? u : apiBase() + u) : null; }

export function PlatformOverviewPanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/super-admin/overview');
        setData(res.data);
      } catch (err: any) {
        if (err.response?.status === 403) toast.error('Yetkisiz');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!data) return null;

  const maxRevenue = Math.max(...data.dailySeries.map((d) => d.revenue), 1);
  const growthPositive = data.gmv.growthPct >= 0;

  return (
    <div className="space-y-5">
      {/* Hero metrics */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard
          label="Platform GMV (Son 30 gün)"
          value={fmtTry(data.gmv.last30)}
          subValue={`Bugün: ${fmtTry(data.gmv.today)}`}
          icon={TrendingUp}
          tone="indigo"
          trendPct={data.gmv.growthPct}
        />
        <MetricCard
          label="Platform Geliri (Komisyon)"
          value={fmtTry(data.commission.last30)}
          subValue={`Toplam: ${fmtTry(data.commission.all)}`}
          icon={Percent}
          tone="emerald"
        />
        <MetricCard
          label="Firma"
          value={`${data.tenants.active}`}
          subValue={`${data.tenants.total} toplam · +${data.tenants.newLast7} yeni (7g)`}
          icon={Building2}
          tone="amber"
        />
        <MetricCard
          label="Kullanıcı"
          value={`${data.users.total.toLocaleString('tr-TR')}`}
          subValue={`+${data.users.newLast7} yeni (7g)`}
          icon={Users}
          tone="sky"
        />
      </motion.div>

      {/* Alert tiles */}
      {(data.alerts.pendingApprovals > 0 || data.alerts.pendingComplaints > 0 || data.alerts.failedRefunds > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.alerts.pendingApprovals > 0 && (
            <AlertTile
              icon={Clock} tone="amber"
              label="Onay Bekleyen Firma"
              count={data.alerts.pendingApprovals}
              action={() => onNavigate?.('platform-approvals')}
              actionLabel="İncele"
            />
          )}
          {data.alerts.pendingComplaints > 0 && (
            <AlertTile
              icon={ShieldAlert} tone="rose"
              label="Açık Şikayet"
              count={data.alerts.pendingComplaints}
              action={() => onNavigate?.('feedback')}
              actionLabel="Şikayetler"
            />
          )}
          {data.alerts.failedRefunds > 0 && (
            <AlertTile
              icon={RotateCcw} tone="rose"
              label="Başarısız İade"
              count={data.alerts.failedRefunds}
              action={() => onNavigate?.('bookings')}
              actionLabel="Bilet Yönetimi"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* GMV trend chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-black tracking-tight uppercase tracking-widest text-slate-500 dark:text-zinc-400">Son 30 Gün · GMV</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{fmtTry(data.gmv.last30)}</p>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black ${
              growthPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
            }`}>
              {growthPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              %{Math.abs(data.gmv.growthPct).toFixed(1)}
            </div>
          </div>
          {/* Simple bar chart */}
          <div className="flex items-end gap-1 h-32">
            {data.dailySeries.map((d, i) => {
              const h = Math.max(2, (d.revenue / maxRevenue) * 100);
              const isLast = i === data.dailySeries.length - 1;
              return (
                <div
                  key={d.date}
                  className="flex-1 relative group flex items-end"
                  style={{ minWidth: 3 }}
                  title={`${new Date(d.date).toLocaleDateString('tr-TR')}: ${fmtTry(d.revenue)} · ${d.count} bilet`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      isLast ? 'bg-indigo-600' : 'bg-indigo-200 dark:bg-indigo-500/30 group-hover:bg-indigo-400'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{new Date(data.dailySeries[0]?.date || '').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
            <span>Bugün</span>
          </div>
        </div>

        {/* Top tenants leaderboard */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black tracking-tight uppercase tracking-widest text-slate-500 dark:text-zinc-400">En Çok Ciro (30g)</h3>
          </div>
          {data.topTenants.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-6">Henüz satış yok</p>
          ) : (
            <div className="space-y-2">
              {data.topTenants.slice(0, 8).map((t, i) => {
                const logo = toAbs(t.tenant.logoUrl);
                return (
                  <Link
                    key={t.tenant.id}
                    href={`/firma/${t.tenant.slug}`}
                    target="_blank"
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  >
                    <span className="text-xs font-black w-5 text-slate-400">{i + 1}</span>
                    {logo ? (
                      <div className="w-8 h-8 rounded-lg bg-white border overflow-hidden flex items-center justify-center p-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo} alt={t.tenant.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                        {(t.tenant.publicName || t.tenant.name)[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.tenant.publicName || t.tenant.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">{t.bookingCount} bilet</p>
                    </div>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">{fmtTry(t.revenue)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tenant status tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusTile label="Aktif Firma" count={data.tenants.active} tone="emerald" />
        <StatusTile label="Onay Bekleyen" count={data.tenants.pending} tone="amber" onClick={() => onNavigate?.('platform-approvals')} />
        <StatusTile label="Askıda" count={data.tenants.suspended} tone="rose" />
        <StatusTile label="Yeni (7g)" count={data.tenants.newLast7} tone="sky" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon: Icon, tone, trendPct }: any) {
  const toneMap: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trendPct !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded ${
            trendPct >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
          }`}>
            {trendPct >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            {Math.abs(trendPct).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">{value}</p>
      {subValue && <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">{subValue}</p>}
    </div>
  );
}

function AlertTile({ icon: Icon, tone, label, count, action, actionLabel }: any) {
  const toneMap: Record<string, string> = {
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
  };
  return (
    <button onClick={action} className={`text-left p-4 rounded-2xl border ${toneMap[tone]} hover:scale-[1.02] transition-transform`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-3xl font-black tabular-nums">{count}</span>
      </div>
      <p className="text-xs font-black uppercase tracking-widest">{label}</p>
      <p className="text-[10px] font-bold opacity-80 mt-1">→ {actionLabel}</p>
    </button>
  );
}

function StatusTile({ label, count, tone, onClick }: any) {
  const toneMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    sky: 'text-sky-600 dark:text-sky-400',
  };
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 ${onClick ? 'hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer text-left' : ''}`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
      <p className={`text-3xl font-black tracking-tight mt-1 tabular-nums ${toneMap[tone]}`}>{count}</p>
    </Tag>
  );
}
