"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Plus, Mail, Phone, Loader2, Trash2, Pencil, X, Eye, EyeOff, Bus,
  Search, ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown, Download, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Driver {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
  _count?: { driverTrips: number };
}

type SortField = 'name' | 'email' | 'createdAt' | 'trips';
type SortDir = 'asc' | 'desc';

const initialForm = { name: '', email: '', password: '', phoneNumber: '' };

export function AdminDriversPanel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm] = useState(initialForm);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/users/drivers'); setDrivers(res.data); }
    catch { toast.error('Şoförler yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter + Sort
  const filtered = useMemo(() => {
    let list = [...drivers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || (d.phoneNumber || '').includes(q));
    }
    list.sort((a, b) => {
      let va: any, vb: any;
      if (sortField === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortField === 'email') { va = a.email; vb = b.email; }
      else if (sortField === 'trips') { va = a._count?.driverTrips || 0; vb = b._count?.driverTrips || 0; }
      else { va = a.createdAt; vb = b.createdAt; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [drivers, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  useEffect(() => { setPage(0); }, [search, pageSize]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  };
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />;
  };

  const allSelected = paged.length > 0 && paged.every(d => selected.has(d.id));
  const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(paged.map(d => d.id)));
  const toggleOne = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  // CRUD
  function openCreate() { setEditTarget(null); setForm(initialForm); setShowPwd(false); setFormOpen(true); }
  function openEdit(d: Driver) { setEditTarget(d); setForm({ name: d.name, email: d.email, phoneNumber: d.phoneNumber || '', password: '' }); setShowPwd(false); setFormOpen(true); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        const payload: Record<string, string> = {};
        if (form.name !== editTarget.name) payload.name = form.name;
        if (form.email !== editTarget.email) payload.email = form.email;
        if (form.phoneNumber !== (editTarget.phoneNumber || '')) payload.phoneNumber = form.phoneNumber;
        if (form.password) payload.password = form.password;
        await api.patch(`/users/drivers/${editTarget.id}`, payload);
        toast.success('Şoför güncellendi');
      } else {
        if (form.password.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); setSubmitting(false); return; }
        const payload: Record<string, string> = { name: form.name, email: form.email.toLowerCase(), password: form.password };
        if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim();
        await api.post('/users/drivers', payload);
        toast.success('Şoför oluşturuldu');
      }
      setFormOpen(false); load();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'İşlem başarısız');
    } finally { setSubmitting(false); }
  }

  async function remove(d: Driver) {
    if (!confirm(`${d.name} silinecek. Emin misin?`)) return;
    setDeleting(d.id);
    try { await api.delete(`/users/drivers/${d.id}`); toast.success('Şoför silindi'); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Silinemedi'); }
    finally { setDeleting(null); }
  }

  async function bulkDelete() {
    if (!confirm(`${selected.size} şoför silinecek. Devam?`)) return;
    let ok = 0;
    for (const id of selected) { try { await api.delete(`/users/drivers/${id}`); ok++; } catch {} }
    toast.success(`${ok} şoför silindi`); setSelected(new Set()); load();
  }

  const exportCSV = () => {
    const headers = ['Ad Soyad', 'E-posta', 'Telefon', 'Sefer Sayısı', 'Kayıt Tarihi'];
    const rows = filtered.map(d => [
      d.name, d.email, d.phoneNumber || '—', d._count?.driverTrips ?? 0,
      new Date(d.createdAt).toLocaleDateString('tr-TR'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `soforler_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success('CSV indirildi');
  };

  const totalTrips = drivers.reduce((s, d) => s + (d._count?.driverTrips || 0), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Chip icon={User} label="Toplam Şoför" value={drivers.length} color="indigo" />
          <Chip icon={Bus} label="Toplam Sefer" value={totalTrips} color="emerald" />
          <Chip icon={CheckCircle2} label="Ort. Sefer/Şoför" value={drivers.length ? Math.round(totalTrips / drivers.length) : 0} color="amber" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Ad, email veya telefon ara..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>}
            </div>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            {selected.size > 0 && (
              <button onClick={bulkDelete} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
                <Trash2 className="w-3.5 h-3.5" /> {selected.size} Sil
              </button>
            )}
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" /> Şoför Ekle
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
              <User className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-500">{search ? 'Eşleşen şoför yok' : 'Henüz şoför eklenmemiş'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Ad Soyad <SortIcon field="name" /></button></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('email')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">E-posta <SortIcon field="email" /></button></th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Telefon</th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('trips')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Sefer <SortIcon field="trips" /></button></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Kayıt <SortIcon field="createdAt" /></button></th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paged.map(d => (
                    <tr key={d.id} className={`group transition-colors ${selected.has(d.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {d.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-zinc-900 dark:text-white">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-semibold">{d.email}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-semibold">{d.phoneNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                          {d._count?.driverTrips ?? 0} sefer
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs font-semibold tabular-nums">{new Date(d.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => remove(d)} disabled={deleting === d.id} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 transition-colors">
                            {deleting === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800">
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 outline-none">
                {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} / {filtered.length}</span>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
            onClick={() => !submitting && setFormOpen(false)}>
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} onSubmit={submit}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">{editTarget ? 'Şoför Düzenle' : 'Yeni Şoför'}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{editTarget ? 'Bilgileri güncelle. Şifre boş bırakılırsa değişmez.' : 'Hesap bilgilerini gir.'}</p>
                </div>
                <button type="button" onClick={() => setFormOpen(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6 space-y-4">
                <Field label="Ad Soyad" required value={form.name} onChange={v => setForm({...form, name: v})} />
                <Field label="E-posta" required type="email" value={form.email} onChange={v => setForm({...form, email: v})} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                    Şifre {editTarget && <span className="normal-case tracking-normal text-zinc-400/70 ml-1">(boş = değişmez)</span>}
                  </label>
                  <div className="relative">
                    <input
                      required={!editTarget} type={showPwd ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      minLength={editTarget ? undefined : 6} placeholder={editTarget ? '••••••••' : 'En az 6 karakter'}
                      className="w-full px-3 py-2.5 pr-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Field label="Telefon (isteğe bağlı)" value={form.phoneNumber} onChange={v => setForm({...form, phoneNumber: v})} placeholder="05XX XXX XX XX" />
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button type="button" onClick={() => setFormOpen(false)} disabled={submitting} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {editTarget ? 'Kaydet' : 'Oluştur'}
                </button>
              </div>
            </motion.form>
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
