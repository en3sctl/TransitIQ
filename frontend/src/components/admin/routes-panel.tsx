"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Route as RouteIcon, Search, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronsUpDown,
  ArrowUp, ArrowDown, Download, X, Loader2, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Route {
  id: string;
  title: string;
  originStation: { id: string; name: string; city: string };
  destinationStation: { id: string; name: string; city: string };
  basePrice: number | string;
  totalDistanceKm: number;
}

type SortField = 'origin' | 'basePrice' | 'totalDistanceKm';
type SortDir = 'asc' | 'desc';

export function RoutesPanel() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('origin');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([api.get('/routes'), api.get('/stations').catch(() => ({ data: [] }))]);
      setRoutes(r.data);
      setStations(s.data);
    } catch { toast.error('Rotalar yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...routes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.originStation.city.toLowerCase().includes(q) ||
        r.destinationStation.city.toLowerCase().includes(q) ||
        r.originStation.name.toLowerCase().includes(q) ||
        r.destinationStation.name.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va: any, vb: any;
      if (sortField === 'origin') { va = a.originStation.city.toLowerCase(); vb = b.originStation.city.toLowerCase(); }
      else if (sortField === 'basePrice') { va = Number(a.basePrice); vb = Number(b.basePrice); }
      else { va = a.totalDistanceKm; vb = b.totalDistanceKm; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [routes, search, sortField, sortDir]);

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

  const allSelected = paged.length > 0 && paged.every(r => selected.has(r.id));
  const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(paged.map(r => r.id)));
  const toggleOne = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const deleteRoute = async (id: string) => {
    if (!confirm('Rota silinsin mi?')) return;
    setDeleting(id);
    try { await api.delete(`/routes/${id}`); toast.success('Rota silindi'); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Silinemedi'); }
    finally { setDeleting(null); }
  };

  const bulkDelete = async () => {
    if (!confirm(`${selected.size} rota silinecek. Devam?`)) return;
    let ok = 0;
    for (const id of selected) { try { await api.delete(`/routes/${id}`); ok++; } catch {} }
    toast.success(`${ok} rota silindi`); setSelected(new Set()); load();
  };

  const startEdit = (r: Route) => {
    setEditRoute(r);
    setEditData({ basePrice: Number(r.basePrice), totalDistanceKm: r.totalDistanceKm });
  };

  const saveEdit = async () => {
    if (!editRoute) return;
    setSaving(true);
    try {
      await api.patch(`/routes/${editRoute.id}`, editData);
      toast.success('Rota güncellendi'); setEditRoute(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Güncellenemedi'); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const headers = ['Kalkış', 'Varış', 'Mesafe (km)', 'Taban Fiyat (₺)'];
    const rows = filtered.map(r => [
      `${r.originStation.city} - ${r.originStation.name}`,
      `${r.destinationStation.city} - ${r.destinationStation.name}`,
      r.totalDistanceKm,
      Number(r.basePrice).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `rotalar_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success('CSV indirildi');
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Chip icon={RouteIcon} label="Toplam Rota" value={routes.length} color="indigo" />
          <Chip icon={MapPin} label="Toplam İstasyon" value={stations.length} color="emerald" />
          <Chip icon={RouteIcon} label="Ort. Mesafe" value={routes.length ? Math.round(routes.reduce((s, r) => s + r.totalDistanceKm, 0) / routes.length) : 0} color="amber" suffix=" km" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Şehir veya istasyon ara..." value={search} onChange={e => setSearch(e.target.value)}
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
            <span className="text-[10px] font-bold text-zinc-400 ml-auto uppercase tracking-widest">{filtered.length} sonuç</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : paged.length === 0 ? (
            <div className="py-20 text-center">
              <RouteIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-500">{search ? 'Eşleşen rota yok' : 'Henüz rota tanımlanmamış'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('origin')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Kalkış → Varış <SortIcon field="origin" /></button></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('totalDistanceKm')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Mesafe <SortIcon field="totalDistanceKm" /></button></th>
                    <th className="px-4 py-3 text-right"><button onClick={() => toggleSort('basePrice')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white ml-auto">Fiyat <SortIcon field="basePrice" /></button></th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paged.map(r => (
                    <tr key={r.id} className={`group transition-colors ${selected.has(r.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-zinc-900 dark:text-white text-base">{r.originStation.name} <span className="text-indigo-500 mx-1">→</span> {r.destinationStation.name}</span>
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{r.originStation.city} — {r.destinationStation.city}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-bold">{r.totalDistanceKm} km</td>
                      <td className="px-4 py-3 text-right font-black text-lg text-zinc-900 dark:text-white tabular-nums">₺{Number(r.basePrice).toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteRoute(r.id)} disabled={deleting === r.id} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 transition-colors">
                            {deleting === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sayfa:</span>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 outline-none">
                  {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} / {filtered.length}</span>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editRoute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditRoute(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Rota Düzenle</h3>
                <button onClick={() => setEditRoute(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{editRoute.originStation.name} → {editRoute.destinationStation.name}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Taban Fiyat (₺)</label>
                    <input type="number" value={editData.basePrice} onChange={e => setEditData({...editData, basePrice: Number(e.target.value)})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Mesafe (km)</label>
                    <input type="number" value={editData.totalDistanceKm} onChange={e => setEditData({...editData, totalDistanceKm: Number(e.target.value)})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button onClick={() => setEditRoute(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
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

function Chip({ icon: Icon, label, value, color, suffix = '' }: { icon: any; label: string; value: number; color: string; suffix?: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls[color]} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{value}{suffix}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      </div>
    </div>
  );
}
