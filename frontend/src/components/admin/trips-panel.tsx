"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Search, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronsUpDown,
  ArrowUp, ArrowDown, Download, X, Loader2, Bus, MapPin, Clock, CheckCircle2, XCircle, Play,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface Trip {
  id: string;
  departureTime: string;
  estimatedArrival: string | null;
  status: string;
  notes: string | null;
  route: { originStation: { name: string; city: string }; destinationStation: { name: string; city: string } };
  vehicle: { id: string; registrationPlate: string; make: string };
  driver: { id: string; name: string; email: string } | null;
}

type SortField = 'departureTime' | 'status' | 'route';
type SortDir = 'asc' | 'desc';

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  PLANNED: { label: 'Planlandı', cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50', icon: Clock },
  ACTIVE: { label: 'Aktif', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50', icon: Play },
  COMPLETED: { label: 'Tamamlandı', cls: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700', icon: CheckCircle2 },
  CANCELLED: { label: 'İptal', cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30', icon: XCircle },
};

function fDateTime(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function TripsPanel() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('departureTime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [routes, setRoutes] = useState<any[]>([]);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ routeId: '', vehicleId: '', driverId: '', departureTime: '', estimatedArrival: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, v, d, r] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles').catch(() => ({ data: [] })),
        api.get('/users/drivers').catch(() => ({ data: [] })),
        api.get('/routes').catch(() => ({ data: [] })),
      ]);
      setTrips(t.data);
      setVehicles(v.data);
      setDrivers(d.data);
      setRoutes(r.data);
    } catch { toast.error('Seferler yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...trips];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.route.originStation.city.toLowerCase().includes(q) ||
        t.route.destinationStation.city.toLowerCase().includes(q) ||
        t.vehicle.registrationPlate.toLowerCase().includes(q) ||
        (t.driver?.name || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') list = list.filter(t => t.status === statusFilter);

    // Geçmişte kalmış ama hala PLANNED/ACTIVE görünen seferleri gizle.
    // (Cron her 10 dk COMPLETED'e çekiyor; bu arada UI'da temiz göster.)
    const now = Date.now();
    if (statusFilter === 'ALL' || statusFilter === 'PLANNED' || statusFilter === 'ACTIVE') {
      list = list.filter((t) => {
        if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return true;
        return new Date(t.departureTime).getTime() >= now - 12 * 60 * 60 * 1000;
      });
    }

    list.sort((a, b) => {
      let va: any, vb: any;
      if (sortField === 'departureTime') { va = a.departureTime; vb = b.departureTime; }
      else if (sortField === 'status') { va = a.status; vb = b.status; }
      else { va = a.route.originStation.city; vb = b.route.originStation.city; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [trips, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  useEffect(() => { setPage(0); }, [search, statusFilter, pageSize]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  };
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />;
  };

  const allSelected = paged.length > 0 && paged.every(t => selected.has(t.id));
  const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(paged.map(t => t.id)));
  const toggleOne = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const cancelTrip = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Seferi iptal et',
      message: 'Bu sefer iptal edilecek. Satılmış biletler varsa yolculara bildirim atılmalı.',
      variant: 'danger',
      confirmLabel: 'İptal Et',
    });
    if (!ok) return;
    try { await api.delete(`/trips/${id}`); toast.success('Sefer iptal edildi'); load(); } catch (e: any) { toast.error(e.response?.data?.message || 'İptal edilemedi'); }
  };

  const bulkCancel = async () => {
    const ok = await confirmDialog({
      title: 'Toplu sefer iptali',
      message: `${selected.size} sefer iptal edilecek. Satılmış biletler etkilenebilir.`,
      variant: 'danger',
      confirmLabel: `${selected.size} seferi iptal et`,
    });
    if (!ok) return;
    let count = 0;
    for (const id of selected) { try { await api.delete(`/trips/${id}`); count++; } catch {} }
    toast.success(`${count} sefer iptal edildi`);
    setSelected(new Set());
    load();
  };

  const startEdit = (t: Trip) => {
    setEditTrip(t);
    setEditData({
      driverId: t.driver?.id || '',
      vehicleId: t.vehicle.id,
      departureTime: t.departureTime.slice(0, 16),
      estimatedArrival: t.estimatedArrival?.slice(0, 16) || '',
      status: t.status,
    });
  };

  const saveEdit = async () => {
    if (!editTrip) return;
    setSaving(true);
    try {
      const payload: any = {};
      if (editData.driverId && editData.driverId !== editTrip.driver?.id) payload.driverId = editData.driverId;
      if (editData.vehicleId && editData.vehicleId !== editTrip.vehicle.id) payload.vehicleId = editData.vehicleId;
      if (editData.departureTime) payload.departureTime = new Date(editData.departureTime).toISOString();
      if (editData.estimatedArrival) payload.estimatedArrival = new Date(editData.estimatedArrival).toISOString();
      if (editData.status !== editTrip.status) payload.status = editData.status;
      await api.patch(`/trips/${editTrip.id}`, payload);
      toast.success('Sefer güncellendi');
      setEditTrip(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Güncellenemedi'); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const headers = ['Rota', 'Kalkış', 'Varış', 'Araç', 'Şoför', 'Durum'];
    const rows = filtered.map(t => [
      `${t.route.originStation.city} → ${t.route.destinationStation.city}`,
      fDateTime(t.departureTime),
      t.estimatedArrival ? fDateTime(t.estimatedArrival) : '—',
      t.vehicle.registrationPlate,
      t.driver?.name || '—',
      STATUS_MAP[t.status]?.label || t.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `seferler_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success('CSV indirildi');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.driverId) { toast.error('Şoför seçin'); return; }
    setSaving(true);
    try {
      const payload: any = { routeId: createForm.routeId, vehicleId: createForm.vehicleId, driverId: createForm.driverId, departureTime: new Date(createForm.departureTime).toISOString() };
      if (createForm.estimatedArrival) payload.estimatedArrival = new Date(createForm.estimatedArrival).toISOString();
      await api.post('/trips', payload);
      toast.success('Sefer oluşturuldu');
      setShowCreate(false);
      setCreateForm({ routeId: '', vehicleId: '', driverId: '', departureTime: '', estimatedArrival: '' });
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Sefer oluşturulamadı'); }
    finally { setSaving(false); }
  };

  const planned = trips.filter(t => t.status === 'PLANNED').length;
  const active = trips.filter(t => t.status === 'ACTIVE').length;
  const completed = trips.filter(t => t.status === 'COMPLETED').length;

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Chip icon={CalendarDays} label="Toplam" value={trips.length} color="indigo" />
          <Chip icon={Clock} label="Planlanan" value={planned} color="blue" />
          <Chip icon={Play} label="Aktif" value={active} color="emerald" />
          <Chip icon={CheckCircle2} label="Tamamlanan" value={completed} color="zinc" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Şehir, plaka, şoför ara..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>}
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer">
              <option value="ALL">Tüm Durumlar</option>
              <option value="PLANNED">Planlanan</option>
              <option value="ACTIVE">Aktif</option>
              <option value="COMPLETED">Tamamlanan</option>
              <option value="CANCELLED">İptal</option>
            </select>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            {selected.size > 0 && (
              <button onClick={bulkCancel} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all">
                <XCircle className="w-3.5 h-3.5" /> {selected.size} İptal Et
              </button>
            )}
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" /> Sefer Oluştur
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
              <CalendarDays className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-500">{search || statusFilter !== 'ALL' ? 'Filtrelerle eşleşen sefer yok' : 'Henüz sefer oluşturulmamış'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('route')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Rota <SortIcon field="route" /></button></th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('departureTime')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Kalkış <SortIcon field="departureTime" /></button></th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Araç</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Şoför</th>
                    <th className="px-4 py-3 text-left"><button onClick={() => toggleSort('status')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Durum <SortIcon field="status" /></button></th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paged.map(t => {
                    const st = STATUS_MAP[t.status] || STATUS_MAP.PLANNED;
                    return (
                      <tr key={t.id} className={`group transition-colors ${selected.has(t.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}>
                        <td className="px-4 py-3"><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleOne(t.id)} className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600" /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-white">{t.route.originStation.city} <span className="text-indigo-500 mx-1">→</span> {t.route.destinationStation.city}</span>
                            <span className="text-[10px] text-zinc-400 font-semibold">{t.route.originStation.name} → {t.route.destinationStation.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{fDateTime(t.departureTime)}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-semibold">{t.vehicle.registrationPlate}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-semibold">{t.driver?.name || '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.cls}`}>{st.label}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                              <button onClick={() => cancelTrip(t.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sayfa başına:</span>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 outline-none">
                  {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} / {filtered.length}</span>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editTrip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditTrip(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Sefer Düzenle</h3>
                  <p className="text-xs font-semibold text-zinc-400 mt-0.5">{editTrip.route.originStation.city} → {editTrip.route.destinationStation.city}</p>
                </div>
                <button onClick={() => setEditTrip(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Kalkış Zamanı</label>
                    <input type="datetime-local" value={editData.departureTime} onChange={e => setEditData({...editData, departureTime: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Tahmini Varış</label>
                    <input type="datetime-local" value={editData.estimatedArrival} onChange={e => setEditData({...editData, estimatedArrival: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Araç</label>
                  <select value={editData.vehicleId} onChange={e => setEditData({...editData, vehicleId: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                    {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registrationPlate} — {v.make} {v.model}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Şoför</label>
                  <select value={editData.driverId} onChange={e => setEditData({...editData, driverId: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                    <option value="">Seçilmedi</option>
                    {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Durum</label>
                  <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                    <option value="PLANNED">Planlanan</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="COMPLETED">Tamamlandı</option>
                    <option value="CANCELLED">İptal</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button onClick={() => setEditTrip(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">İptal</button>
                <button onClick={saveEdit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Trip Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} onSubmit={submitCreate}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div><h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Yeni Sefer</h3><p className="text-xs text-zinc-400 mt-0.5">Sefer detaylarını girin</p></div>
                <button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Rota</label>
                  <select required value={createForm.routeId} onChange={e => setCreateForm({...createForm, routeId: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                    <option value="">Rota seçin</option>
                    {routes.map((r: any) => <option key={r.id} value={r.id}>{r.originStation?.name} → {r.destinationStation?.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Araç</label>
                    <select required value={createForm.vehicleId} onChange={e => setCreateForm({...createForm, vehicleId: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                      <option value="">Araç seçin</option>
                      {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registrationPlate} — {v.make}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Şoför</label>
                    <select value={createForm.driverId} onChange={e => setCreateForm({...createForm, driverId: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                      <option value="">Şoför seçin</option>
                      {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Kalkış Zamanı</label>
                    <input type="datetime-local" required value={createForm.departureTime} onChange={e => setCreateForm({...createForm, departureTime: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Tahmini Varış</label>
                    <input type="datetime-local" value={createForm.estimatedArrival} onChange={e => setCreateForm({...createForm, estimatedArrival: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Sefer Oluştur
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Chip({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
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
