"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bus, Gauge, Calendar, ShieldCheck, Wrench, Droplet, AlertTriangle,
  TrendingUp, Plus, Trash2, Loader2, CheckCircle2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Props {
  vehicleId: string | null;
  onClose: () => void;
}

interface Summary {
  vehicle: any;
  stats: {
    tripCount: number;
    bookingCount: number;
    totalMaintenanceCost: number;
    totalFuelCost: number;
    economyKmPerL: number | null;
  };
  alerts: {
    upcomingInspection: string | null;
    upcomingInsurance: string | null;
    overdueInspection: string | null;
    overdueInsurance: string | null;
  };
  maintenance: any[];
  fuel: any[];
}

const MAINT_TYPES = [
  { value: 'OIL_CHANGE', label: 'Yağ Değişimi' },
  { value: 'TIRE', label: 'Lastik' },
  { value: 'BRAKE', label: 'Fren' },
  { value: 'INSPECTION', label: 'Muayene' },
  { value: 'INSURANCE', label: 'Sigorta' },
  { value: 'CLEANING', label: 'Detaylı Temizlik' },
  { value: 'REPAIR', label: 'Tamirat' },
  { value: 'OTHER', label: 'Diğer' },
];

function fDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function VehicleDetailModal({ vehicleId, onClose }: Props) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'maintenance' | 'fuel'>('overview');
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);

  const [maintForm, setMaintForm] = useState({
    type: 'OIL_CHANGE', description: '', cost: '', odometerAt: '', performedAt: new Date().toISOString().slice(0, 10),
    performedBy: '', nextDueAt: '', nextDueKm: '',
  });
  const [fuelForm, setFuelForm] = useState({
    liters: '', pricePerL: '', odometerAt: '', station: '', fueledAt: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      const res = await api.get(`/vehicles/${vehicleId}/summary`);
      setData(res.data);
    } catch {
      toast.error('Araç bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { if (vehicleId) load(); }, [vehicleId, load]);

  async function submitMaintenance(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = {
        type: maintForm.type,
        performedAt: maintForm.performedAt,
      };
      if (maintForm.description) payload.description = maintForm.description;
      if (maintForm.cost) payload.cost = Number(maintForm.cost);
      if (maintForm.odometerAt) payload.odometerAt = Number(maintForm.odometerAt);
      if (maintForm.performedBy) payload.performedBy = maintForm.performedBy;
      if (maintForm.nextDueAt) payload.nextDueAt = maintForm.nextDueAt;
      if (maintForm.nextDueKm) payload.nextDueKm = Number(maintForm.nextDueKm);

      await api.post(`/vehicles/${vehicleId}/maintenance`, payload);
      toast.success('Bakım kaydı eklendi');
      setShowMaintForm(false);
      setMaintForm({
        type: 'OIL_CHANGE', description: '', cost: '', odometerAt: '',
        performedAt: new Date().toISOString().slice(0, 10),
        performedBy: '', nextDueAt: '', nextDueKm: '',
      });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Eklenemedi');
    }
  }

  async function submitFuel(e: React.FormEvent) {
    e.preventDefault();
    try {
      const liters = Number(fuelForm.liters);
      const pricePerL = Number(fuelForm.pricePerL);
      await api.post(`/vehicles/${vehicleId}/fuel`, {
        liters,
        pricePerL,
        totalCost: Math.round(liters * pricePerL * 100) / 100,
        odometerAt: Number(fuelForm.odometerAt),
        station: fuelForm.station || undefined,
        fueledAt: fuelForm.fueledAt,
      });
      toast.success('Yakıt kaydı eklendi');
      setShowFuelForm(false);
      setFuelForm({ liters: '', pricePerL: '', odometerAt: '', station: '', fueledAt: new Date().toISOString().slice(0, 10) });
      load();
    } catch {
      toast.error('Eklenemedi');
    }
  }

  async function deleteMaintenance(id: string) {
    if (!confirm('Bakım kaydı silinsin mi?')) return;
    await api.delete(`/vehicles/${vehicleId}/maintenance/${id}`);
    load();
  }

  async function deleteFuel(id: string) {
    if (!confirm('Yakıt kaydı silinsin mi?')) return;
    await api.delete(`/vehicles/${vehicleId}/fuel/${id}`);
    load();
  }

  if (!vehicleId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl h-[94vh] sm:h-[88vh] bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">
                  {data?.vehicle?.registrationPlate || 'Araç'}
                </h2>
                {data && (
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    {data.vehicle.make} {data.vehicle.model} · {data.vehicle.capacity} koltuk · {data.vehicle.layoutType}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 py-3 border-b border-slate-200/60 dark:border-zinc-800 shrink-0">
            {[
              { id: 'overview', label: 'Genel Bakış' },
              { id: 'maintenance', label: 'Bakım' },
              { id: 'fuel', label: 'Yakıt' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors ${
                  tab === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : !data ? (
              <p className="text-center text-sm text-slate-500 py-10">Veri yok</p>
            ) : tab === 'overview' ? (
              <div className="space-y-5">
                {/* Alerts */}
                {(data.alerts.overdueInspection || data.alerts.overdueInsurance || data.alerts.upcomingInspection || data.alerts.upcomingInsurance) && (
                  <div className="space-y-2">
                    {data.alerts.overdueInspection && (
                      <AlertCard
                        color="rose"
                        icon={AlertTriangle}
                        title="MUAYENE SÜRESİ GEÇMİŞ"
                        desc={`${fDate(data.alerts.overdueInspection)} tarihinde dolmuş`}
                      />
                    )}
                    {data.alerts.overdueInsurance && (
                      <AlertCard
                        color="rose"
                        icon={AlertTriangle}
                        title="SİGORTA SÜRESİ GEÇMİŞ"
                        desc={`${fDate(data.alerts.overdueInsurance)} tarihinde dolmuş`}
                      />
                    )}
                    {data.alerts.upcomingInspection && (
                      <AlertCard
                        color="amber"
                        icon={Calendar}
                        title="Muayene yaklaşıyor"
                        desc={`${fDate(data.alerts.upcomingInspection)} — 30 gün içinde`}
                      />
                    )}
                    {data.alerts.upcomingInsurance && (
                      <AlertCard
                        color="amber"
                        icon={ShieldCheck}
                        title="Sigorta yenilemesi yaklaşıyor"
                        desc={`${fDate(data.alerts.upcomingInsurance)} — 30 gün içinde`}
                      />
                    )}
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Gauge} label="Güncel Km" value={`${(data.vehicle.currentMileage || 0).toLocaleString('tr-TR')} km`} color="indigo" />
                  <StatCard icon={TrendingUp} label="Yakıt/Km" value={data.stats.economyKmPerL ? `${data.stats.economyKmPerL} km/L` : '—'} color="emerald" />
                  <StatCard icon={Bus} label="Toplam Sefer" value={String(data.stats.tripCount)} color="slate" />
                  <StatCard icon={CheckCircle2} label="Toplam Satış" value={String(data.stats.bookingCount)} color="amber" />
                </div>

                {/* Costs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="w-3.5 h-3.5 text-amber-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Toplam Bakım</p>
                    </div>
                    <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
                      ₺{data.stats.totalMaintenanceCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplet className="w-3.5 h-3.5 text-emerald-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Toplam Yakıt</p>
                    </div>
                    <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
                      ₺{data.stats.totalFuelCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Critical dates */}
                <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-2xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">Resmi Tarihler</p>
                  <div className="grid grid-cols-2 gap-3">
                    <KeyVal label="Muayene" value={fDate(data.vehicle.muayeneTarihi)} />
                    <KeyVal label="Sigorta" value={fDate(data.vehicle.sigortaTarihi)} />
                    <KeyVal label="Model Yılı" value={data.vehicle.year || '—'} />
                    <KeyVal label="Şasi No" value={data.vehicle.chassisNumber || '—'} />
                  </div>
                </div>

                {/* Recent maintenance + fuel */}
                {data.maintenance.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Son Bakım</p>
                    <div className="space-y-1.5">
                      {data.maintenance.slice(0, 3).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-lg">
                          <div className="flex items-center gap-2 text-xs">
                            <Wrench className="w-3 h-3 text-amber-500" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {MAINT_TYPES.find((t) => t.value === m.type)?.label || m.type}
                            </span>
                            <span className="text-slate-500">{fDate(m.performedAt)}</span>
                          </div>
                          {m.cost && <span className="text-xs font-black text-slate-700 dark:text-zinc-300">₺{Number(m.cost).toLocaleString('tr-TR')}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : tab === 'maintenance' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                    Bakım Geçmişi ({data.maintenance.length})
                  </p>
                  <button
                    onClick={() => setShowMaintForm(!showMaintForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Yeni Kayıt
                  </button>
                </div>

                <AnimatePresence>
                  {showMaintForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={submitMaintenance}
                      className="overflow-hidden"
                    >
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select label="Tip" value={maintForm.type} onChange={(v) => setMaintForm({ ...maintForm, type: v })}>
                          {MAINT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </Select>
                        <Input label="Yapılış Tarihi" type="date" value={maintForm.performedAt} onChange={(v) => setMaintForm({ ...maintForm, performedAt: v })} required />
                        <Input label="Açıklama" value={maintForm.description} onChange={(v) => setMaintForm({ ...maintForm, description: v })} />
                        <Input label="Yapan Kişi / Servis" value={maintForm.performedBy} onChange={(v) => setMaintForm({ ...maintForm, performedBy: v })} />
                        <Input label="Maliyet (₺)" type="number" value={maintForm.cost} onChange={(v) => setMaintForm({ ...maintForm, cost: v })} />
                        <Input label="Km" type="number" value={maintForm.odometerAt} onChange={(v) => setMaintForm({ ...maintForm, odometerAt: v })} />
                        <Input label="Sonraki Tarih" type="date" value={maintForm.nextDueAt} onChange={(v) => setMaintForm({ ...maintForm, nextDueAt: v })} />
                        <Input label="Sonraki Km" type="number" value={maintForm.nextDueKm} onChange={(v) => setMaintForm({ ...maintForm, nextDueKm: v })} />
                        <div className="md:col-span-2 flex gap-2 mt-2">
                          <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">Ekle</button>
                          <button type="button" onClick={() => setShowMaintForm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-sm">İptal</button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {data.maintenance.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">Henüz kayıt yok</div>
                ) : (
                  <div className="space-y-2">
                    {data.maintenance.map((m) => (
                      <div key={m.id} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {MAINT_TYPES.find((t) => t.value === m.type)?.label || m.type}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">{fDate(m.performedAt)}</span>
                            {m.cost && <span className="ml-auto text-sm font-black text-slate-900 dark:text-white">₺{Number(m.cost).toLocaleString('tr-TR')}</span>}
                          </div>
                          {m.description && <p className="text-xs text-slate-600 dark:text-zinc-400">{m.description}</p>}
                          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1 flex-wrap">
                            {m.performedBy && <span>Servis: {m.performedBy}</span>}
                            {m.odometerAt && <span>Km: {m.odometerAt.toLocaleString('tr-TR')}</span>}
                            {m.nextDueAt && <span>Sonraki: {fDate(m.nextDueAt)}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMaintenance(m.id)}
                          className="shrink-0 w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Fuel tab
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                    Yakıt Kayıtları ({data.fuel.length})
                  </p>
                  <button
                    onClick={() => setShowFuelForm(!showFuelForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Yeni Kayıt
                  </button>
                </div>

                <AnimatePresence>
                  {showFuelForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={submitFuel}
                      className="overflow-hidden"
                    >
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Litre" type="number" value={fuelForm.liters} onChange={(v) => setFuelForm({ ...fuelForm, liters: v })} required />
                        <Input label="Litre Fiyatı (₺)" type="number" value={fuelForm.pricePerL} onChange={(v) => setFuelForm({ ...fuelForm, pricePerL: v })} required />
                        <Input label="Tarih" type="date" value={fuelForm.fueledAt} onChange={(v) => setFuelForm({ ...fuelForm, fueledAt: v })} required />
                        <Input label="Km" type="number" value={fuelForm.odometerAt} onChange={(v) => setFuelForm({ ...fuelForm, odometerAt: v })} required />
                        <Input label="İstasyon" value={fuelForm.station} onChange={(v) => setFuelForm({ ...fuelForm, station: v })} />
                        {fuelForm.liters && fuelForm.pricePerL && (
                          <div className="md:col-span-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-400">
                            Toplam: ₺{(Number(fuelForm.liters) * Number(fuelForm.pricePerL)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        <div className="md:col-span-2 flex gap-2 mt-2">
                          <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">Ekle</button>
                          <button type="button" onClick={() => setShowFuelForm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-sm">İptal</button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {data.fuel.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">Henüz kayıt yok</div>
                ) : (
                  <div className="space-y-2">
                    {data.fuel.map((f) => (
                      <div key={f.id} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Droplet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {Number(f.liters).toFixed(1)} L · ₺{Number(f.pricePerL).toFixed(2)}/L
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">{fDate(f.fueledAt)}</span>
                            <span className="ml-auto text-sm font-black text-slate-900 dark:text-white">
                              ₺{Number(f.totalCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                            <span>Km: {f.odometerAt.toLocaleString('tr-TR')}</span>
                            {f.station && <span>· {f.station}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteFuel(f.id)}
                          className="shrink-0 w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const COLOR_STATS: Record<string, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
      <div className={`inline-flex w-8 h-8 rounded-lg mb-2 items-center justify-center ${COLOR_STATS[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
      <p className="text-base font-black tracking-tighter text-slate-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

function AlertCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
      color === 'rose'
        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    }`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color === 'rose' ? 'text-rose-600' : 'text-amber-600'}`} />
      <div>
        <p className={`text-sm font-black ${color === 'rose' ? 'text-rose-900 dark:text-rose-200' : 'text-amber-900 dark:text-amber-200'}`}>{title}</p>
        <p className={`text-xs font-medium ${color === 'rose' ? 'text-rose-700 dark:text-rose-300/80' : 'text-amber-700 dark:text-amber-300/80'}`}>{desc}</p>
      </div>
    </div>
  );
}

function KeyVal({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-0.5">{label}</p>
      <p className="text-xs font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, required }: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
      >
        {children}
      </select>
    </div>
  );
}
