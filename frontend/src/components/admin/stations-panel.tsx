"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Search, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronsUpDown,
  ArrowUp, ArrowDown, Download, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { OtogarPicker } from "./otogar-picker";
import { CSVImport } from "./csv-import";

interface Station {
  id: string;
  name: string;
  city: string;
  locationLat: number | null;
  locationLng: number | null;
}

type SortField = 'name' | 'city';
type SortDir = 'asc' | 'desc';

export function StationsPanel() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('city');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', city: '', locationLat: '', locationLng: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/stations'); setStations(r.data); }
    catch { toast.error('İstasyonlar yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...stations];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const va = a[sortField].toLowerCase();
      const vb = b[sortField].toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [stations, search, sortField, sortDir]);

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

  const allSelected = paged.length > 0 && paged.every(s => selected.has(s.id));
  const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(paged.map(s => s.id)));
  const toggleOne = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const deleteStation = async (id: string) => {
    if (!confirm('İstasyon silinsin mi?')) return;
    setDeleting(id);
    try { await api.delete(`/stations/${id}`); toast.success('İstasyon silindi'); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Silinemedi'); }
    finally { setDeleting(null); }
  };

  const bulkDelete = async () => {
    if (!confirm(`${selected.size} istasyon silinecek. Devam?`)) return;
    let ok = 0;
    for (const id of selected) { try { await api.delete(`/stations/${id}`); ok++; } catch {} }
    toast.success(`${ok} istasyon silindi`); setSelected(new Set()); load();
  };

  const startEdit = (s: Station) => {
    setEditStation(s);
    setEditData({ name: s.name, city: s.city, locationLat: s.locationLat ?? '', locationLng: s.locationLng ?? '' });
  };

  const saveEdit = async () => {
    if (!editStation) return;
    setSaving(true);
    try {
      await api.patch(`/stations/${editStation.id}`, {
        name: editData.name,
        city: editData.city,
        locationLat: editData.locationLat ? Number(editData.locationLat) : null,
        locationLng: editData.locationLng ? Number(editData.locationLng) : null,
      });
      toast.success('İstasyon güncellendi'); setEditStation(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Güncellenemedi'); }
    finally { setSaving(false); }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/stations', {
        name: createForm.name,
        city: createForm.city,
        locationLat: createForm.locationLat ? Number(createForm.locationLat) : null,
        locationLng: createForm.locationLng ? Number(createForm.locationLng) : null,
      });
      toast.success('İstasyon eklendi');
      setShowCreate(false);
      setCreateForm({ name: '', city: '', locationLat: '', locationLng: '' });
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'İstasyon eklenemedi'); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const headers = ['İstasyon Adı', 'Şehir', 'Enlem', 'Boylam'];
    const rows = filtered.map(s => [s.name, s.city, s.locationLat ?? '', s.locationLng ?? '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `istasyonlar_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success('CSV indirildi');
  };

  const uniqueCities = [...new Set(stations.map(s => s.city))].length;

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
            <div><p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{stations.length}</p><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Toplam İstasyon</p></div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
            <div><p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{uniqueCities}</p><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Şehir</p></div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="İstasyon veya şehir ara..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"><X className="w-4 h-4" /></button>}
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            {selected.size > 0 && (
              <button onClick={bulkDelete} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600">
                <Trash2 className="w-3.5 h-3.5" /> {selected.size} Sil
              </button>
            )}
            <CSVImport title="İstasyon" endpoint="/stations" onComplete={load}
              sampleRow={{ name: 'Esenler Otogarı', city: 'İstanbul', locationLat: '41.0435', locationLng: '28.8930' }}
              columns={[
                { csvHeader: 'Ad', payloadKey: 'name', required: true },
                { csvHeader: 'Şehir', payloadKey: 'city', required: true },
                { csvHeader: 'Enlem', payloadKey: 'locationLat', transform: Number },
                { csvHeader: 'Boylam', payloadKey: 'locationLng', transform: Number },
              ]} />
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" /> İstasyon Ekle
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
              <MapPin className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-500">{search ? 'Eşleşen istasyon yok' : 'Henüz istasyon eklenmemiş'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">İstasyon Adı <SortIcon field="name" /></button></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('city')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Şehir <SortIcon field="city" /></button></th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Koordinat</th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paged.map(s => (
                    <tr key={s.id} className={`group transition-colors ${selected.has(s.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></td>
                      <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white">{s.name}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-semibold">{s.city}</td>
                      <td className="px-4 py-3 text-right font-mono text-[10px] text-zinc-400">{s.locationLat && s.locationLng ? `${Number(s.locationLat).toFixed(4)}, ${Number(s.locationLng).toFixed(4)}` : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteStation(s.id)} disabled={deleting === s.id} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 transition-colors">
                            {deleting === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Edit Dialog */}
      <AnimatePresence>
        {editStation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditStation(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">İstasyon Düzenle</h3>
                <button onClick={() => setEditStation(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">İstasyon Adı</label>
                  <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Şehir</label>
                  <input value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Enlem</label>
                    <input type="number" step="any" value={editData.locationLat} onChange={e => setEditData({...editData, locationLat: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Boylam</label>
                    <input type="number" step="any" value={editData.locationLng} onChange={e => setEditData({...editData, locationLng: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button onClick={() => setEditStation(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
                <button onClick={saveEdit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Station Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} onSubmit={submitCreate}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div><h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Yeni İstasyon</h3><p className="text-xs text-zinc-400 mt-0.5">Otogar veya terminal ekleyin</p></div>
                <button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <OtogarPicker onSelect={(o: any) => setCreateForm({ name: o.name, city: o.city, locationLat: o.lat.toString(), locationLng: o.lng.toString() })} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">İstasyon Adı</label>
                  <input required value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} placeholder="Esenler Otogarı"
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Şehir</label>
                  <input required value={createForm.city} onChange={e => setCreateForm({...createForm, city: e.target.value})} placeholder="İstanbul"
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Enlem</label>
                    <input type="number" step="any" value={createForm.locationLat} onChange={e => setCreateForm({...createForm, locationLat: e.target.value})} placeholder="41.035"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Boylam</label>
                    <input type="number" step="any" value={createForm.locationLng} onChange={e => setCreateForm({...createForm, locationLng: e.target.value})} placeholder="28.892"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} İstasyon Ekle
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
