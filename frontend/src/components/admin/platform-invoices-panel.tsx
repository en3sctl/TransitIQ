"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, Download, Check, Plus, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { TenantPicker } from "./tenant-picker";
import { confirmDialog } from "@/components/ui/dialogs";

function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }
function toAbs(u: string | null) { return u ? (u.startsWith('http') ? u : apiBase() + u) : null; }

const STATUS_META: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Taslak', tone: 'slate' },
  ISSUED: { label: 'Kesildi', tone: 'indigo' },
  SENT: { label: 'Gönderildi', tone: 'sky' },
  PAID: { label: 'Ödendi', tone: 'emerald' },
  OVERDUE: { label: 'Gecikmiş', tone: 'rose' },
  CANCELLED: { label: 'İptal', tone: 'slate' },
};
const TONE: Record<string, string> = {
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700',
  sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700',
};

function lastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function PlatformInvoicesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [range, setRange] = useState(lastMonthRange);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/invoices');
      setItems(res.data?.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createInvoice = async () => {
    if (!tenantId) { toast.error('Firma seç'); return; }
    setGenerating(true);
    try {
      await api.post('/super-admin/invoices/generate', {
        tenantId,
        periodStart: new Date(range.start).toISOString(),
        periodEnd: new Date(range.end + 'T23:59:59').toISOString(),
      });
      toast.success('Fatura oluşturuldu');
      setCreatorOpen(false);
      setTenantId(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Oluşturulamadı');
    } finally { setGenerating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    if (status === 'PAID') {
      const ok = await confirmDialog({
        title: 'Ödendi olarak işaretle',
        message: 'Bu faturanın ödendi olarak işaretlenmesi geri alınamaz. Devam?',
        variant: 'success',
        confirmLabel: 'Ödendi İşaretle',
      });
      if (!ok) return;
    }
    try {
      await api.patch(`/super-admin/invoices/${id}/status`, { status });
      toast.success('Güncellendi');
      load();
    } catch { toast.error('Güncellenemedi'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Platform Faturaları</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Aylık komisyon faturaları — PDF üretilir, firmaya e-posta atılır.</p>
        </div>
        <button onClick={() => setCreatorOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> Fatura Oluştur
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Henüz fatura yok</p>
          <p className="text-[11px] text-slate-400 mt-1">Her ayın sonunda fatura oluştur.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-950 border-b">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="text-left px-4 py-3">No</th>
                <th className="text-left px-4 py-3">Firma</th>
                <th className="text-left px-4 py-3">Dönem</th>
                <th className="text-right px-4 py-3">Komisyon</th>
                <th className="text-right px-4 py-3">Abonelik</th>
                <th className="text-right px-4 py-3">KDV</th>
                <th className="text-center px-4 py-3">Durum</th>
                <th className="text-center px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {items.map((inv) => {
                const meta = STATUS_META[inv.status] || STATUS_META.DRAFT;
                const pdfUrl = toAbs(inv.pdfUrl);
                return (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono text-xs font-bold">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-xs font-bold">{inv.tenant.publicName || inv.tenant.name}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{new Date(inv.periodStart).toLocaleDateString('tr-TR')} - {new Date(inv.periodEnd).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold">₺{Number(inv.commissionTotal).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3 text-right tabular-nums">₺{Number(inv.subscriptionFee).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">₺{Number(inv.taxAmount).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${TONE[meta.tone]}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-center">
                        {pdfUrl && (
                          <a href={pdfUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800">
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                          </a>
                        )}
                        {inv.status !== 'PAID' && (
                          <button onClick={() => updateStatus(inv.id, 'PAID')} className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/10" title="Ödendi işaretle">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fatura oluşturma modal'ı */}
      <AnimatePresence>
        {creatorOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setCreatorOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-black tracking-tight">Fatura Oluştur</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Firma ve dönem seç, komisyon + abonelik otomatik hesaplanır.</p>
                </div>
                <button onClick={() => setCreatorOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                <TenantPicker
                  label="Firma"
                  value={tenantId}
                  onChange={(id) => setTenantId(id)}
                  placeholder="Firma ara / seç"
                />

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Fatura Dönemi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 mb-0.5">Başlangıç</p>
                      <input type="date" value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 mb-0.5">Bitiş</p>
                      <input type="date" value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => setRange(lastMonthRange())} className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold">Geçen Ay</button>
                    <button onClick={() => setRange(currentMonthRange())} className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold">Bu Ay</button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-950/50 flex items-center justify-end gap-2">
                <button onClick={() => setCreatorOpen(false)} className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-bold">Vazgeç</button>
                <button
                  onClick={createInvoice}
                  disabled={!tenantId || generating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Fatura Kes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
