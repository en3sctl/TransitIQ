"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Percent, Search, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Download,
  X, Loader2, ToggleLeft, ToggleRight, Copy, CheckCircle2, Clock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface Promo {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  minBookingAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  createdAt: string;
  _count?: { applications: number };
}

function fDate(s: string) {
  return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(s: string) { return new Date(s) < new Date(); }

export function PromoPanel() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [editPromo, setEditPromo] = useState<Promo | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '', discountType: 'PERCENT', discountValue: '', minBookingAmount: '',
    maxUses: '', validFrom: new Date().toISOString().slice(0, 10), validUntil: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/promo-codes'); setPromos(r.data); }
    catch { toast.error('Promo kodları yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return promos;
    const q = search.toLowerCase();
    return promos.filter(p => p.code.toLowerCase().includes(q));
  }, [promos, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/promo-codes', {
        code: createForm.code,
        discountType: createForm.discountType,
        discountValue: Number(createForm.discountValue),
        minBookingAmount: createForm.minBookingAmount ? Number(createForm.minBookingAmount) : undefined,
        maxUses: createForm.maxUses ? Number(createForm.maxUses) : undefined,
        validFrom: createForm.validFrom,
        validUntil: createForm.validUntil,
      });
      toast.success('Promo kodu oluşturuldu');
      setShowCreate(false);
      setCreateForm({ code: '', discountType: 'PERCENT', discountValue: '', minBookingAmount: '', maxUses: '', validFrom: new Date().toISOString().slice(0, 10), validUntil: '' });
      load();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Oluşturulamadı');
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string) => {
    try { await api.patch(`/promo-codes/${id}/toggle`); load(); }
    catch { toast.error('Değiştirilemedi'); }
  };

  const deletePromo = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Promo kodu sil',
      message: 'Bu promosyon kodu silinecek. Kullanımdaysa mevcut rezervasyonları etkilemez.',
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!ok) return;
    try { await api.delete(`/promo-codes/${id}`); toast.success('Silindi'); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Silinemedi'); }
  };

  const startEdit = (p: Promo) => {
    setEditPromo(p);
    setEditData({
      discountValue: Number(p.discountValue),
      minBookingAmount: p.minBookingAmount ? Number(p.minBookingAmount) : '',
      maxUses: p.maxUses ?? '',
      validUntil: p.validUntil.slice(0, 10),
      active: p.active,
    });
  };

  const saveEdit = async () => {
    if (!editPromo) return;
    setSaving(true);
    try {
      await api.patch(`/promo-codes/${editPromo.id}`, {
        discountValue: editData.discountValue,
        minBookingAmount: editData.minBookingAmount ? Number(editData.minBookingAmount) : null,
        maxUses: editData.maxUses ? Number(editData.maxUses) : null,
        validUntil: editData.validUntil,
        active: editData.active,
      });
      toast.success('Güncellendi');
      setEditPromo(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Güncellenemedi'); }
    finally { setSaving(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${code} kopyalandı`);
  };

  const exportCSV = () => {
    const headers = ['Kod', 'Tür', 'İndirim', 'Min Tutar', 'Maks Kullanım', 'Kullanılan', 'Başlangıç', 'Bitiş', 'Durum'];
    const rows = filtered.map(p => [
      p.code, p.discountType === 'PERCENT' ? 'Yüzde' : 'Sabit',
      p.discountType === 'PERCENT' ? `%${p.discountValue}` : `₺${p.discountValue}`,
      p.minBookingAmount ? `₺${p.minBookingAmount}` : '—',
      p.maxUses ?? 'Sınırsız', p.usedCount,
      fDate(p.validFrom), fDate(p.validUntil),
      p.active ? 'Aktif' : 'Pasif',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `promokodlar_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success('CSV indirildi');
  };

  const activeCount = promos.filter(p => p.active && !isExpired(p.validUntil)).length;
  const totalUsed = promos.reduce((s, p) => s + p.usedCount, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Chip icon={Percent} label="Toplam Kod" value={promos.length} color="indigo" />
          <Chip icon={CheckCircle2} label="Aktif" value={activeCount} color="emerald" />
          <Chip icon={Clock} label="Toplam Kullanım" value={totalUsed} color="amber" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Kod ara..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" /> Promo Kodu Oluştur
            </button>
            <span className="text-[10px] font-bold text-zinc-400 ml-auto uppercase tracking-widest">{filtered.length} sonuç</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : paged.length === 0 ? (
            <div className="py-20 text-center">
              <Percent className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-500">{search ? 'Eşleşen kod yok' : 'Henüz promo kodu oluşturulmamış'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Kod</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">İndirim</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Kullanım</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Geçerlilik</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Durum</th>
                    <th className="w-28 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paged.map(p => {
                    const expired = isExpired(p.validUntil);
                    const limitReached = p.maxUses ? p.usedCount >= p.maxUses : false;
                    return (
                      <tr key={p.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm tracking-wider">{p.code}</code>
                            <button onClick={() => copyCode(p.code)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {p.discountType === 'PERCENT' ? `%${Number(p.discountValue).toFixed(0)}` : `₺${Number(p.discountValue).toFixed(0)}`}
                          </span>
                          {p.minBookingAmount && (
                            <span className="text-[10px] text-zinc-400 ml-1.5">min ₺{Number(p.minBookingAmount).toFixed(0)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{p.usedCount}</span>
                          <span className="text-zinc-400">/{p.maxUses ?? '∞'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                          {fDate(p.validFrom)} — {fDate(p.validUntil)}
                        </td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700">Süresi Dolmuş</span>
                          ) : limitReached ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">Limit Dolu</span>
                          ) : p.active ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">Aktif</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">Pasif</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleActive(p.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors" title={p.active ? 'Pasife al' : 'Aktifleştir'}>
                              {p.active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deletePromo(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > pageSize && (
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-500">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} / {filtered.length}</span>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} onSubmit={submitCreate}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div><h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Yeni Promo Kodu</h3><p className="text-xs text-zinc-400 mt-0.5">İndirim kodu oluşturun</p></div>
                <button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <Field label="Kod" required value={createForm.code} onChange={v => setCreateForm({...createForm, code: v.toUpperCase()})} placeholder="YAZ2026" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">İndirim Türü</label>
                    <select value={createForm.discountType} onChange={e => setCreateForm({...createForm, discountType: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                      <option value="PERCENT">Yüzde (%)</option>
                      <option value="FIXED">Sabit Tutar (₺)</option>
                    </select>
                  </div>
                  <Field label={createForm.discountType === 'PERCENT' ? 'Yüzde (%)' : 'Tutar (₺)'} required type="number" value={createForm.discountValue} onChange={v => setCreateForm({...createForm, discountValue: v})} placeholder={createForm.discountType === 'PERCENT' ? '15' : '50'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Min Sipariş (₺)" type="number" value={createForm.minBookingAmount} onChange={v => setCreateForm({...createForm, minBookingAmount: v})} placeholder="100" />
                  <Field label="Maks Kullanım" type="number" value={createForm.maxUses} onChange={v => setCreateForm({...createForm, maxUses: v})} placeholder="Sınırsız" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Başlangıç" required type="date" value={createForm.validFrom} onChange={v => setCreateForm({...createForm, validFrom: v})} />
                  <Field label="Bitiş" required type="date" value={createForm.validUntil} onChange={v => setCreateForm({...createForm, validUntil: v})} />
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Oluştur
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editPromo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditPromo(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div><h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Kodu Düzenle</h3><p className="text-xs text-zinc-400 mt-0.5"><code className="font-mono text-indigo-600">{editPromo.code}</code></p></div>
                <button onClick={() => setEditPromo(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <Field label={editPromo.discountType === 'PERCENT' ? 'Yüzde (%)' : 'Tutar (₺)'} type="number" value={String(editData.discountValue)} onChange={v => setEditData({...editData, discountValue: Number(v)})} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Min Sipariş (₺)" type="number" value={String(editData.minBookingAmount)} onChange={v => setEditData({...editData, minBookingAmount: v})} />
                  <Field label="Maks Kullanım" type="number" value={String(editData.maxUses)} onChange={v => setEditData({...editData, maxUses: v})} />
                </div>
                <Field label="Bitiş Tarihi" type="date" value={editData.validUntil} onChange={v => setEditData({...editData, validUntil: v})} />
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Aktif</span>
                  <button type="button" onClick={() => setEditData({...editData, active: !editData.active})} className="text-zinc-500">
                    {editData.active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button onClick={() => setEditPromo(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
                <button onClick={saveEdit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">{label}</label>
      <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
    </div>
  );
}

function Chip({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls[color]} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      </div>
    </div>
  );
}
