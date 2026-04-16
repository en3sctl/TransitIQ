"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bus, Search, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronsUpDown,
  ArrowUpDown, ArrowUp, ArrowDown, Download, Filter, X, AlertTriangle,
  ShieldCheck, Calendar, CheckCircle2, Loader2, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { VehicleDetailModal } from "./vehicle-detail-modal";

interface Vehicle {
  id: string;
  registrationPlate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  layoutType: string;
  status: string;
  currentMileage: number;
  muayeneTarihi: string | null;
  sigortaTarihi: string | null;
  createdAt: string;
}

type SortField = 'registrationPlate' | 'make' | 'year' | 'capacity' | 'currentMileage' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Aktif', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' },
  MAINTENANCE: { label: 'Bakımda', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' },
  RETIRED: { label: 'Emekli', cls: 'bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700' },
};

const PAGE_SIZES = [10, 25, 50, 100];

function fDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpiringSoon(d: string | null): 'overdue' | 'warning' | null {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  if (date < now) return 'overdue';
  if (date.getTime() - now.getTime() < 30 * 86400000) return 'warning';
  return null;
}

export function VehiclesPanel() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL'); // ALL | WARNING | OVERDUE
  const [sortField, setSortField] = useState<SortField>('registrationPlate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Vehicle>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch {
      toast.error('Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Filter + Sort + Search ───
  const filtered = useMemo(() => {
    let list = [...vehicles];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.registrationPlate.toLowerCase().includes(q) ||
        (v.make || '').toLowerCase().includes(q) ||
        (v.model || '').toLowerCase().includes(q) ||
        String(v.year).includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter(v => v.status === statusFilter);
    }

    // Expiry filter
    if (expiryFilter === 'WARNING') {
      list = list.filter(v => isExpiringSoon(v.muayeneTarihi) === 'warning' || isExpiringSoon(v.sigortaTarihi) === 'warning');
    } else if (expiryFilter === 'OVERDUE') {
      list = list.filter(v => isExpiringSoon(v.muayeneTarihi) === 'overdue' || isExpiringSoon(v.sigortaTarihi) === 'overdue');
    }

    // Sort
    list.sort((a, b) => {
      let va: any = a[sortField];
      let vb: any = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [vehicles, search, statusFilter, expiryFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [search, statusFilter, expiryFilter, pageSize]);

  // ─── Sort toggle ───
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />;
  };

  // ─── Bulk select ───
  const allSelected = paged.length > 0 && paged.every(v => selected.has(v.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(paged.map(v => v.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // ─── Delete ───
  const deleteVehicle = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Araç silindi', {
        action: { label: 'Geri Al', onClick: () => restoreVehicle(id) },
      });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Silinemedi');
    } finally {
      setDeleting(null);
    }
  };

  const restoreVehicle = async (id: string) => {
    try {
      await api.patch(`/vehicles/${id}`, { status: 'ACTIVE' });
      toast.success('Araç geri yüklendi');
      load();
    } catch {
      toast.error('Geri yüklenemedi');
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`${selected.size} araç silinecek. Devam?`)) return;
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      try { await api.delete(`/vehicles/${id}`); ok++; } catch {}
    }
    toast.success(`${ok} araç silindi`);
    setSelected(new Set());
    load();
  };

  // ─── Edit Dialog ───
  const startEdit = (v: Vehicle) => {
    setEditId(v.id);
    setEditData({
      registrationPlate: v.registrationPlate,
      make: v.make,
      model: v.model,
      year: v.year,
      capacity: v.capacity,
      layoutType: v.layoutType,
      currentMileage: v.currentMileage,
      status: v.status,
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await api.patch(`/vehicles/${editId}`, editData);
      toast.success('Araç güncellendi');
      setEditId(null);
      load();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  // ─── CSV Export ───
  const exportCSV = () => {
    const headers = ['Plaka', 'Marka', 'Model', 'Yıl', 'Kapasite', 'Düzen', 'Km', 'Durum', 'Muayene', 'Sigorta'];
    const rows = filtered.map(v => [
      v.registrationPlate, v.make, v.model, v.year, v.capacity, v.layoutType,
      v.currentMileage, v.status, fDate(v.muayeneTarihi), fDate(v.sigortaTarihi),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `araclar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV indirildi');
  };

  // ─── Stats ───
  const activeCount = vehicles.filter(v => v.status === 'ACTIVE').length;
  const warningCount = vehicles.filter(v => isExpiringSoon(v.muayeneTarihi) === 'warning' || isExpiringSoon(v.sigortaTarihi) === 'warning').length;
  const overdueCount = vehicles.filter(v => isExpiringSoon(v.muayeneTarihi) === 'overdue' || isExpiringSoon(v.sigortaTarihi) === 'overdue').length;

  return (
    <>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatChip icon={Bus} label="Toplam Araç" value={vehicles.length} color="indigo" />
          <StatChip icon={CheckCircle2} label="Aktif" value={activeCount} color="emerald" />
          <StatChip icon={Calendar} label="Yaklaşan" value={warningCount} color="amber" />
          <StatChip icon={AlertTriangle} label="Süresi Geçmiş" value={overdueCount} color="rose" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Plaka, marka, model ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="MAINTENANCE">Bakımda</option>
              <option value="RETIRED">Emekli</option>
            </select>

            {/* Expiry filter */}
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
            >
              <option value="ALL">Muayene/Sigorta</option>
              <option value="WARNING">Yaklaşan (30 gün)</option>
              <option value="OVERDUE">Süresi Geçmiş</option>
            </select>

            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

            {/* CSV */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>

            {/* Bulk delete */}
            {selected.size > 0 && (
              <button
                onClick={bulkDelete}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {selected.size} Sil
              </button>
            )}

            <span className="text-[10px] font-bold text-zinc-400 ml-auto uppercase tracking-widest">
              {filtered.length} sonuç
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : paged.length === 0 ? (
            <div className="py-20 text-center">
              <Bus className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                {search || statusFilter !== 'ALL' || expiryFilter !== 'ALL' ? 'Filtrelerle eşleşen araç yok' : 'Henüz araç eklenmemiş'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => toggleSort('registrationPlate')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Plaka <SortIcon field="registrationPlate" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => toggleSort('make')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Marka / Model <SortIcon field="make" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => toggleSort('year')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Yıl <SortIcon field="year" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Düzen</th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => toggleSort('capacity')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Kapasite <SortIcon field="capacity" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => toggleSort('currentMileage')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Km <SortIcon field="currentMileage" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Muayene</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Sigorta</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Durum</th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paged.map((v) => {
                    const isEditing = editId === v.id;
                    const muayeneStatus = isExpiringSoon(v.muayeneTarihi);
                    const sigortaStatus = isExpiringSoon(v.sigortaTarihi);
                    const st = STATUS_MAP[v.status] || STATUS_MAP.ACTIVE;

                    return (
                      <tr
                        key={v.id}
                        className={`group transition-colors ${selected.has(v.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(v.id)}
                            onChange={() => toggleOne(v.id)}
                            className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDetailId(v.id)}
                            className="font-bold text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {v.registrationPlate}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{v.make} {v.model}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-semibold tabular-nums">{v.year}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                            {v.layoutType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-semibold tabular-nums">{v.capacity}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-semibold tabular-nums">{(v.currentMileage || 0).toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3"><ExpiryBadge status={muayeneStatus} date={v.muayeneTarihi} /></td>
                        <td className="px-4 py-3"><ExpiryBadge status={sigortaStatus} date={v.sigortaTarihi} /></td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(v)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteVehicle(v.id)}
                              disabled={deleting === v.id}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            >
                              {deleting === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sayfa başına:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 outline-none"
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">
                  {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} / {filtered.length}
                </span>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <VehicleDetailModal vehicleId={detailId} onClose={() => setDetailId(null)} />

      {/* Edit Dialog */}
      <AnimatePresence>
        {editId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Araç Düzenle</h3>
                  <p className="text-xs font-semibold text-zinc-400 mt-0.5">{editData.registrationPlate}</p>
                </div>
                <button onClick={() => setEditId(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <EditField label="Plaka" value={editData.registrationPlate || ''} onChange={v => setEditData({...editData, registrationPlate: v})} />
                  <EditField label="Marka" value={editData.make || ''} onChange={v => setEditData({...editData, make: v})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <EditField label="Model" value={editData.model || ''} onChange={v => setEditData({...editData, model: v})} />
                  <EditField label="Model Yılı" value={String(editData.year || '')} onChange={v => setEditData({...editData, year: Number(v)})} type="number" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <EditField label="Kapasite" value={String(editData.capacity || '')} onChange={v => setEditData({...editData, capacity: Number(v)})} type="number" />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Koltuk Düzeni</label>
                    <select
                      value={editData.layoutType || '2+1'}
                      onChange={e => setEditData({...editData, layoutType: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="2+1">2+1 VIP</option>
                      <option value="2+2">2+2 Standart</option>
                      <option value="1+1">1+1 Business</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Durum</label>
                    <select
                      value={editData.status || 'ACTIVE'}
                      onChange={e => setEditData({...editData, status: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="MAINTENANCE">Bakımda</option>
                      <option value="RETIRED">Emekli</option>
                    </select>
                  </div>
                </div>
                <EditField label="Güncel Km" value={String(editData.currentMileage || '')} onChange={v => setEditData({...editData, currentMileage: Number(v)})} type="number" />
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setEditId(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatChip({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls[color]} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      />
    </div>
  );
}

function ExpiryBadge({ status, date }: { status: 'overdue' | 'warning' | null; date: string | null }) {
  if (!date) return <span className="text-[10px] font-semibold text-zinc-400">—</span>;
  const d = fDate(date);
  if (status === 'overdue') {
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">{d}</span>;
  }
  if (status === 'warning') {
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">{d}</span>;
  }
  return <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{d}</span>;
}
