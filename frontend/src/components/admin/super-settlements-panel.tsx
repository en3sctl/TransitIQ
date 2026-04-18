"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Calendar, CheckCheck, Check, RefreshCw, Download, Wallet, Clock, XCircle, CheckCircle2, TrendingUp, Percent } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog, promptDialog } from "@/components/ui/dialogs";

interface SettlementItem {
  id: string;
  bookingId: string;
  status: 'PENDING' | 'SETTLED' | 'REVERSED';
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  commissionRate: number;
  createdAt: string;
  settledAt: string | null;
  notes: string | null;
  tenant: { id: string; name: string; publicName: string | null; slug: string; logoUrl: string | null };
}

function fmtTry(v: number) {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }
function toAbs(u: string | null) { return u ? (u.startsWith('http') ? u : apiBase() + u) : null; }

const STATUS_META: Record<string, { label: string; tone: string; icon: any }> = {
  PENDING: { label: 'Bekliyor', tone: 'amber', icon: Clock },
  SETTLED: { label: 'Ödendi', tone: 'emerald', icon: CheckCircle2 },
  REVERSED: { label: 'İptal', tone: 'rose', icon: XCircle },
};
const TONE: Record<string, string> = {
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

export function SuperSettlementsPanel() {
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [totals, setTotals] = useState({ gross: 0, commission: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/settlements', {
        params: {
          status: statusFilter || undefined,
          from: from || undefined,
          to: to || undefined,
          take: 500,
        },
      });
      setItems(res.data?.items || []);
      setTotals(res.data?.totals || { gross: 0, commission: 0, net: 0 });
      setSelected(new Set());
    } catch (err: any) {
      if (err.response?.status === 403) toast.error('Sadece süper admin');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, from, to]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const pending = items.filter((i) => i.status === 'PENDING');
    if (selected.size === pending.length) setSelected(new Set());
    else setSelected(new Set(pending.map((i) => i.id)));
  };

  const settleOne = async (id: string) => {
    const notes = await promptDialog({
      title: 'Ödendi işaretle',
      message: 'İsteğe bağlı ödeme notu ekleyebilirsin (EFT/havale referans no vb.).',
      label: 'Ödeme notu',
      placeholder: 'Örn: BT20260417-0042',
      confirmLabel: 'Ödendi İşaretle',
      variant: 'success',
    });
    if (notes === null) return;
    try {
      await api.patch(`/super-admin/settlements/${id}/settle`, { notes: notes || undefined });
      toast.success('Ödendi işaretlendi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Güncellenemedi');
    }
  };

  const bulkSettle = async () => {
    if (selected.size === 0) return;
    const ok = await confirmDialog({
      title: 'Toplu ödendi işaretleme',
      message: `${selected.size} settlement kaydı "Ödendi" olarak işaretlenecek. Bu işlem geri alınamaz.`,
      variant: 'success',
      confirmLabel: `${selected.size} kaydı ödendi işaretle`,
    });
    if (!ok) return;
    try {
      const res = await api.post('/super-admin/settlements/bulk-settle', { ids: Array.from(selected) });
      toast.success(`${res.data?.count || selected.size} kayıt ödendi`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    }
  };

  const backfill = async () => {
    const ok = await confirmDialog({
      title: 'Settlement Backfill',
      message: 'Geçmiş CONFIRMED biletler için eksik Settlement kayıtları oluşturulacak. İşlem tekrar çalıştırılabilir (idempotent).',
      variant: 'default',
      confirmLabel: 'Backfill Çalıştır',
    });
    if (!ok) return;
    try {
      const res = await api.post('/super-admin/settlements/backfill', {});
      toast.success(`${res.data.created} kayıt oluşturuldu (${res.data.scanned} taranan)`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Backfill başarısız');
    }
  };

  // Group by tenant for tenant-level summary (simple reduction)
  const byTenant = items.reduce((acc, s) => {
    const key = s.tenant.id;
    if (!acc[key]) acc[key] = { tenant: s.tenant, count: 0, gross: 0, commission: 0, net: 0 };
    acc[key].count++;
    acc[key].gross += s.grossAmount;
    acc[key].commission += s.commissionAmount;
    acc[key].net += s.netAmount;
    return acc;
  }, {} as Record<string, any>);
  const tenantRollup = Object.values(byTenant);

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      {/* Totals hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 text-white rounded-3xl p-6 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Toplam Brut
            </p>
            <p className="text-3xl font-black tracking-tight">{fmtTry(totals.gross)}</p>
            <p className="text-[11px] opacity-60 font-semibold mt-1">{items.length} kayıt</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 flex items-center gap-1.5">
              <Percent className="w-3 h-3" /> Platform Geliri
            </p>
            <p className="text-3xl font-black tracking-tight text-indigo-400">{fmtTry(totals.commission)}</p>
            <p className="text-[11px] opacity-60 font-semibold mt-1">
              {totals.gross > 0 ? `%${((totals.commission / totals.gross) * 100).toFixed(1)} ortalama` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 flex items-center gap-1.5">
              <Wallet className="w-3 h-3" /> Firmalara Net
            </p>
            <p className="text-3xl font-black tracking-tight text-emerald-300">{fmtTry(totals.net)}</p>
            <p className="text-[11px] opacity-60 font-semibold mt-1">Firma payı</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Bekleyen
            </p>
            <p className="text-3xl font-black tracking-tight text-amber-300">{pendingCount}</p>
            <p className="text-[11px] opacity-60 font-semibold mt-1">Ödenmesi gereken</p>
          </div>
        </div>
      </motion.div>

      {/* Tenant rollup */}
      {tenantRollup.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
          <h4 className="text-xs font-black tracking-tight uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">Firma Bazlı Özet</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {tenantRollup.map((r: any) => {
              const logo = toAbs(r.tenant.logoUrl);
              return (
                <div key={r.tenant.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800">
                  {logo ? (
                    <div className="w-10 h-10 rounded-lg bg-white border overflow-hidden flex items-center justify-center p-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt={r.tenant.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
                      {(r.tenant.publicName || r.tenant.name)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{r.tenant.publicName || r.tenant.name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{r.count} kayıt · {fmtTry(r.gross)} brut</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{fmtTry(r.net)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">net</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {['', 'PENDING', 'SETTLED', 'REVERSED'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {s ? STATUS_META[s]?.label || s : 'Tümü'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold" />
          <span className="text-slate-400 text-xs">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={bulkSettle}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              <CheckCheck className="w-3.5 h-3.5" /> {selected.size} kaydı Ödendi yap
            </button>
          )}
          <button
            onClick={backfill}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold hover:bg-slate-200"
            title="Geçmiş biletler için Settlement kayıtları oluştur"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Backfill
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <Wallet className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Kayıt yok</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && selected.size === items.filter((i) => i.status === 'PENDING').length}
                      onChange={toggleAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3">Tarih</th>
                  <th className="text-left px-4 py-3">Firma</th>
                  <th className="text-right px-4 py-3">Brut</th>
                  <th className="text-right px-4 py-3">Komisyon</th>
                  <th className="text-right px-4 py-3">Net</th>
                  <th className="text-center px-4 py-3">Durum</th>
                  <th className="text-center px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {items.map((s) => {
                  const meta = STATUS_META[s.status] || STATUS_META.PENDING;
                  const StatusIcon = meta.icon;
                  const isPending = s.status === 'PENDING';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-3 py-3">
                        {isPending && (
                          <input
                            type="checkbox"
                            checked={selected.has(s.id)}
                            onChange={() => toggle(s.id)}
                            className="cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {s.tenant.publicName || s.tenant.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums whitespace-nowrap">{fmtTry(s.grossAmount)}</td>
                      <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-semibold tabular-nums whitespace-nowrap">−{fmtTry(s.commissionAmount)}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400 tabular-nums whitespace-nowrap">{fmtTry(s.netAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${TONE[meta.tone]}`}>
                          <StatusIcon className="w-3 h-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPending ? (
                          <button
                            onClick={() => settleOne(s.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100"
                          >
                            <Check className="w-3 h-3" /> Ödendi
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {s.settledAt ? new Date(s.settledAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
