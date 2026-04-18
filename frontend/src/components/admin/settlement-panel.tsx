"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, TrendingDown, Wallet, Clock, CheckCircle2, XCircle, Percent, Download, Calendar, Filter, Building2, CreditCard, Receipt, Fuel, Coffee, ParkingCircle, Route, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface SettlementItem {
  id: string;
  status: 'PENDING' | 'SETTLED' | 'REVERSED';
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  commissionRate: number;
  createdAt: string;
  settledAt: string | null;
  notes: string | null;
  booking: {
    id: string;
    pnrCode: string;
    passengerName: string;
    bookingTime: string;
    bookingStatus: string;
    origin: string;
    destination: string;
    departureTime: string;
  } | null;
}

interface Summary {
  totalCount: number;
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  pending: { count: number; net: number; gross: number };
  settled: { count: number; net: number; gross: number };
  reversed: { count: number; gross: number };
  commissionRate: number;
  paymentMode: string;
  expenses?: {
    approvedCount: number;
    approvedTotal: number;
    pendingCount: number;
    pendingTotal: number;
    byCategory: Record<string, { count: number; total: number }>;
  };
  netAfterExpenses?: number;
}

const EXPENSE_CATEGORY_META: Record<string, { label: string; icon: any }> = {
  FUEL: { label: 'Yakıt', icon: Fuel },
  TOLL: { label: 'Otoyol', icon: Route },
  FOOD: { label: 'Yemek', icon: Coffee },
  PARKING: { label: 'Otopark', icon: ParkingCircle },
  OTHER: { label: 'Diğer', icon: MoreHorizontal },
};

function fmtTry(v: number) {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_META: Record<string, { label: string; tone: string; icon: any }> = {
  PENDING: { label: 'Bekliyor', tone: 'amber', icon: Clock },
  SETTLED: { label: 'Ödendi', tone: 'emerald', icon: CheckCircle2 },
  REVERSED: { label: 'İptal', tone: 'rose', icon: XCircle },
};
const TONE_CLASS: Record<string, string> = {
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

export function SettlementPanel({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        api.get('/admin/settlements/summary', { params: { from: from || undefined, to: to || undefined } }),
        api.get('/admin/settlements', {
          params: {
            status: statusFilter || undefined,
            from: from || undefined,
            to: to || undefined,
            take: 200,
          },
        }),
      ]);
      setSummary(summaryRes.data);
      setItems(listRes.data?.items || []);
    } catch (err: any) {
      if (err.response?.status === 403) toast.error('Yetkisiz');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, from, to]);

  const exportCsv = () => {
    if (items.length === 0) {
      toast.info('Veri yok');
      return;
    }
    const headers = ['Tarih', 'PNR', 'Yolcu', 'Güzergah', 'Gross (TL)', 'Komisyon (TL)', 'Net (TL)', 'Oran (%)', 'Durum', 'Ödenme Tarihi'];
    const rows = items.map((s) => [
      new Date(s.createdAt).toLocaleString('tr-TR'),
      s.booking?.pnrCode || '',
      s.booking?.passengerName || '',
      s.booking ? `${s.booking.origin} → ${s.booking.destination}` : '',
      s.grossAmount.toFixed(2).replace('.', ','),
      s.commissionAmount.toFixed(2).replace('.', ','),
      s.netAmount.toFixed(2).replace('.', ','),
      (s.commissionRate * 100).toFixed(1).replace('.', ','),
      STATUS_META[s.status]?.label || s.status,
      s.settledAt ? new Date(s.settledAt).toLocaleString('tr-TR') : '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hesap-ozeti-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSold = items.length;
  const avgTicket = useMemo(() => {
    if (!summary || summary.totalCount === 0) return 0;
    return summary.totalGross / summary.totalCount;
  }, [summary]);

  return (
    <div className="space-y-5">
      {/* Top hero card */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Toplam Ciro
              </p>
              <p className="text-3xl font-black tracking-tight">{fmtTry(summary.totalGross)}</p>
              <p className="text-[11px] opacity-70 font-semibold mt-1">{summary.totalCount} bilet · Ort. {fmtTry(avgTicket)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1.5">
                <Percent className="w-3 h-3" /> Platform Komisyonu
              </p>
              <p className="text-3xl font-black tracking-tight">{fmtTry(summary.totalCommission)}</p>
              <p className="text-[11px] opacity-70 font-semibold mt-1">%{(summary.commissionRate * 100).toFixed(1)} oran</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1.5">
                <Wallet className="w-3 h-3" /> Net Alacak
              </p>
              <p className="text-3xl font-black tracking-tight text-emerald-300">{fmtTry(summary.totalNet)}</p>
              {summary.expenses && summary.expenses.approvedTotal > 0 && summary.netAfterExpenses != null ? (
                <p className="text-[11px] opacity-80 font-semibold mt-1">
                  − {fmtTry(summary.expenses.approvedTotal)} masraf = <span className="text-emerald-300 font-black">{fmtTry(summary.netAfterExpenses)}</span>
                </p>
              ) : (
                <p className="text-[11px] opacity-70 font-semibold mt-1">Komisyon sonrası</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" /> Ödeme Modu
              </p>
              <p className="text-lg font-black tracking-tight">
                {summary.paymentMode === 'OWN' ? 'Kendi Iyzico Hesabı' : 'Platform Hesabı'}
              </p>
              <p className="text-[11px] opacity-70 font-semibold mt-1">
                {summary.paymentMode === 'OWN'
                  ? 'Ödemeler direkt hesabınıza düşer'
                  : 'Komisyon kesilip net tutar EFT yapılır'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status breakdown tiles */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatusTile
            active={statusFilter === 'PENDING'}
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING')}
            icon={Clock} tone="amber" label="Bekleyen Ödeme"
            count={summary.pending.count}
            subtitle={`${fmtTry(summary.pending.net)} net alacak`}
          />
          <StatusTile
            active={statusFilter === 'SETTLED'}
            onClick={() => setStatusFilter(statusFilter === 'SETTLED' ? '' : 'SETTLED')}
            icon={CheckCircle2} tone="emerald" label="Ödenen"
            count={summary.settled.count}
            subtitle={`${fmtTry(summary.settled.net)} net tahsil edildi`}
          />
          <StatusTile
            active={statusFilter === 'REVERSED'}
            onClick={() => setStatusFilter(statusFilter === 'REVERSED' ? '' : 'REVERSED')}
            icon={XCircle} tone="rose" label="İptal / İade"
            count={summary.reversed.count}
            subtitle={`${fmtTry(summary.reversed.gross)} brut`}
          />
        </div>
      )}

      {/* Şoför Masrafları — yakıt, otoyol, yemek, vs. */}
      {summary?.expenses && (summary.expenses.approvedCount > 0 || summary.expenses.pendingCount > 0) && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Receipt className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Şoför Masrafları</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">Onaylanan masraflar net alacaktan düşülür</p>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('driver-expenses')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Masraf Onayları →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3 h-3" /> Onaylanan (gider)
              </p>
              <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                {fmtTry(summary.expenses.approvedTotal)}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                {summary.expenses.approvedCount} kayıt
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" /> Bekleyen
              </p>
              <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                {fmtTry(summary.expenses.pendingTotal)}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                {summary.expenses.pendingCount} kayıt onay bekliyor
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                <Wallet className="w-3 h-3" /> Masraf Sonrası Net
              </p>
              <p className="text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
                {fmtTry(summary.netAfterExpenses ?? summary.totalNet)}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                Brüt − komisyon − onaylı masraf
              </p>
            </div>
          </div>

          {Object.keys(summary.expenses.byCategory).length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Kategori Kırılımı</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(summary.expenses.byCategory)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([key, val]) => {
                    const meta = EXPENSE_CATEGORY_META[key] || { label: key, icon: MoreHorizontal };
                    const Icon = meta.icon;
                    const pct = summary.expenses!.approvedTotal > 0
                      ? Math.round((val.total / summary.expenses!.approvedTotal) * 100)
                      : 0;
                    return (
                      <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">{meta.label}</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{fmtTry(val.total)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{val.count} kayıt · %{pct}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold"
          />
          <span className="text-slate-400 text-xs">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold"
          />
          {(from || to || statusFilter) && (
            <button
              onClick={() => { setFrom(''); setTo(''); setStatusFilter(''); }}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200"
            >
              <Filter className="w-3 h-3" /> Temizle
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">{totalSold} kayıt</span>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100"
          >
            <Download className="w-3.5 h-3.5" /> CSV
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
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Kayıt bulunamadı</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Bilet satışları onaylandıkça burada ciro ve komisyon hesabı gözükür.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3">Tarih</th>
                  <th className="text-left px-4 py-3">PNR</th>
                  <th className="text-left px-4 py-3">Yolcu</th>
                  <th className="text-left px-4 py-3">Güzergah</th>
                  <th className="text-right px-4 py-3">Brut</th>
                  <th className="text-right px-4 py-3">Komisyon</th>
                  <th className="text-right px-4 py-3">Net</th>
                  <th className="text-center px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {items.map((s) => {
                  const meta = STATUS_META[s.status] || STATUS_META.PENDING;
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
                        {fmtDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {s.booking?.pnrCode || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                        {s.booking?.passengerName || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        {s.booking ? `${s.booking.origin} → ${s.booking.destination}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                        {fmtTry(s.grossAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-semibold tabular-nums whitespace-nowrap">
                        −{fmtTry(s.commissionAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                        {fmtTry(s.netAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${TONE_CLASS[meta.tone]}`}>
                          <StatusIcon className="w-3 h-3" /> {meta.label}
                        </span>
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

function StatusTile({ active, onClick, icon: Icon, tone, label, count, subtitle }: any) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all ${
        active
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-900'
          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONE_CLASS[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{count}</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
      <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-semibold mt-0.5">{subtitle}</p>
    </button>
  );
}
