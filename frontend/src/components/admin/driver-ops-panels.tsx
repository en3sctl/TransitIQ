"use client";

/**
 * Firma admin panelleri — driver operasyonları:
 *  - DriverExpensesPanel: şoför masrafları onayla/reddet
 *  - DriverSosPanel: SOS tetiklenen olaylar (konum + detay + harita linki)
 *  - PreTripChecksPanel: sefer öncesi kontrol raporları (eksik olanlar öncelikli)
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2, Wallet, AlertTriangle, Check, X, MapPin, Phone,
  Fuel, ReceiptText, Utensils, Car, MoreHorizontal, User,
  Clipboard, AlertOctagon, ExternalLink, Clock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog, promptDialog } from "@/components/ui/dialogs";

const CAT_ICONS: Record<string, any> = {
  FUEL: Fuel, TOLL: ReceiptText, FOOD: Utensils, PARKING: Car, OTHER: MoreHorizontal,
};
const CAT_LABELS: Record<string, string> = {
  FUEL: 'Yakıt', TOLL: 'Otoyol', FOOD: 'Yemek', PARKING: 'Otopark', OTHER: 'Diğer',
};

// ═════════════════════════════════════════════════════════════
// DriverExpensesPanel — onay bekleyen + geçmiş masraflar
// ═════════════════════════════════════════════════════════════

interface Expense {
  id: string; category: string; amount: number; description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null; reviewedAt: string | null;
  createdAt: string;
  driver: { id: string; name: string } | null;
  trip: { id: string; departureTime: string; plate: string; route: string } | null;
}

export function DriverExpensesPanel() {
  const [data, setData] = useState<{ items: Expense[]; total: number; stats: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driver-ops/admin/expenses', {
        params: statusFilter ? { status: statusFilter } : undefined,
      });
      setData(res.data);
    } catch {
      toast.error('Masraflar yüklenemedi');
      setData(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const approve = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Masrafı onayla',
      message: 'Bu masraf onaylandığında şoförün alacağı bordroya/raporuna eklenir. Devam?',
      variant: 'success',
      confirmLabel: 'Onayla',
    });
    if (!ok) return;
    setActing(id);
    try {
      await api.patch(`/driver-ops/admin/expenses/${id}/review`, { action: 'APPROVE' });
      toast.success('Onaylandı');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    } finally { setActing(null); }
  };

  const reject = async (id: string) => {
    const note = await promptDialog({
      title: 'Masrafı reddet',
      message: 'Red sebebini yaz; şoför göreceği için net olsun.',
      label: 'Red sebebi',
      placeholder: 'Örn: Makbuz yok, kişisel harcama vb.',
      type: 'textarea',
      variant: 'danger',
      confirmLabel: 'Reddet',
      minLength: 3,
    });
    if (note === null) return;
    setActing(id);
    try {
      await api.patch(`/driver-ops/admin/expenses/${id}/review`, { action: 'REJECT', note });
      toast.success('Reddedildi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    } finally { setActing(null); }
  };

  const stats = data?.stats;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Şoför Masrafları</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Yol/yemek/otopark masrafları — onay sonrası şoföre ödeme yapılır.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatPill label="Bekleyen" count={stats?.pending?.count || 0} total={stats?.pending?.total || 0} color="amber" />
        <StatPill label="Onaylanan" count={stats?.approved?.count || 0} total={stats?.approved?.total || 0} color="emerald" />
        <StatPill label="Reddedilen" count={stats?.rejected?.count || 0} total={stats?.rejected?.total || 0} color="rose" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { v: 'PENDING', label: 'Bekleyen' },
          { v: 'APPROVED', label: 'Onaylanan' },
          { v: 'REJECTED', label: 'Reddedilen' },
          { v: '', label: 'Tümü' },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setStatusFilter(f.v)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
              statusFilter === f.v ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : !data?.items?.length ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <Wallet className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
            {statusFilter === 'PENDING' ? 'Onay bekleyen masraf yok' : 'Kayıt yok'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((e) => {
            const Icon = CAT_ICONS[e.category] || MoreHorizontal;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-black text-slate-900 dark:text-white">
                        {CAT_LABELS[e.category]} · ₺{Number(e.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                      <StatusChip status={e.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1 flex-wrap">
                      {e.driver && <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {e.driver.name}</span>}
                      {e.trip && <span className="inline-flex items-center gap-1"><Car className="w-3 h-3" /> {e.trip.plate} · {e.trip.route}</span>}
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(e.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {e.description && (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-1.5 italic">"{e.description}"</p>
                    )}
                    {e.reviewNote && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5">Red sebebi: {e.reviewNote}</p>
                    )}
                  </div>
                  {e.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => approve(e.id)}
                        disabled={acting === e.id}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Onayla
                      </button>
                      <button
                        onClick={() => reject(e.id)}
                        disabled={acting === e.id}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reddet
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// DriverSosPanel — SOS tetiklenmiş olaylar
// ═════════════════════════════════════════════════════════════

interface SosEvent {
  id: string;
  tripId: string | null;
  timestamp: string;
  driver: { id: string; name: string; phoneNumber: string | null } | null;
  details: {
    category?: string;
    note?: string | null;
    lat?: number | null;
    lng?: number | null;
    vehicle?: string;
    route?: string;
    driver?: string;
  } | null;
}

const SOS_CATEGORY_META: Record<string, { label: string; color: string }> = {
  ACCIDENT: { label: 'Kaza', color: 'bg-rose-500' },
  MEDICAL: { label: 'Sağlık', color: 'bg-pink-500' },
  MECHANICAL: { label: 'Arıza', color: 'bg-amber-500' },
  SECURITY: { label: 'Güvenlik', color: 'bg-indigo-500' },
  OTHER: { label: 'Diğer', color: 'bg-slate-500' },
};

export function DriverSosPanel() {
  const [events, setEvents] = useState<SosEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driver-ops/admin/sos-events');
      setEvents(res.data?.items || []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-500" /> SOS Olayları
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Şoförlerin tetiklediği acil durumlar — konum ve detay.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : events.length === 0 ? (
        <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-10 text-center">
          <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-black text-emerald-900 dark:text-emerald-200">SOS olayı yok</p>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium mt-1">Güvenli sürüş! Şoförler acil durum tetiklemedi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const cat = e.details?.category || 'OTHER';
            const meta = SOS_CATEGORY_META[cat] || SOS_CATEGORY_META.OTHER;
            const hasCoords = e.details?.lat != null && e.details?.lng != null;
            const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${e.details!.lat},${e.details!.lng}` : null;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 border-l-4 border-l-rose-600"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${meta.color} text-white flex items-center justify-center shrink-0`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-black text-slate-900 dark:text-white">{meta.label}</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {new Date(e.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 font-medium flex-wrap">
                      {e.driver && <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {e.driver.name}</span>}
                      {e.details?.vehicle && <span className="inline-flex items-center gap-1"><Car className="w-3 h-3" /> {e.details.vehicle}</span>}
                      {e.details?.route && <span className="inline-flex items-center gap-1">{e.details.route}</span>}
                    </div>
                    {e.details?.note && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                        <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium italic">"{e.details.note}"</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                        >
                          <MapPin className="w-3 h-3" /> Haritada Aç
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {e.driver?.phoneNumber && (
                        <a
                          href={`tel:${e.driver.phoneNumber}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          <Phone className="w-3 h-3" /> Şoförü Ara
                        </a>
                      )}
                      {hasCoords && (
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">{e.details!.lat!.toFixed(5)}, {e.details!.lng!.toFixed(5)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PreTripChecksPanel — son kontrol raporları, eksikler öncelikli
// ═════════════════════════════════════════════════════════════

interface PreTripRow {
  id: string; tripId: string; hasIssue: boolean;
  odometerKm: number | null; fuelLevelPercent: number | null;
  issueNote: string | null;
  fuelOk: boolean; tiresOk: boolean; brakesOk: boolean; lightsOk: boolean;
  hornOk: boolean; wipersOk: boolean; mirrorsOk: boolean; seatbeltsOk: boolean;
  acOk: boolean; cleanInside: boolean; extinguisherOk: boolean;
  firstAidOk: boolean; emergencyHammerOk: boolean;
  createdAt: string;
  driver: { id: string; name: string } | null;
  trip: { id: string; departureTime: string; plate: string; route: string } | null;
}

const CHECK_LABELS: Record<string, string> = {
  fuelOk: 'Yakıt', tiresOk: 'Lastik', brakesOk: 'Fren', lightsOk: 'Farlar',
  hornOk: 'Korna', wipersOk: 'Silecek', mirrorsOk: 'Ayna', seatbeltsOk: 'Kemer',
  acOk: 'Klima', cleanInside: 'Temizlik', extinguisherOk: 'Yangın söndürücü',
  firstAidOk: 'İlk yardım', emergencyHammerOk: 'Cam kırıcı çekiç',
};

export function PreTripChecksPanel() {
  const [items, setItems] = useState<PreTripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyIssues, setOnlyIssues] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driver-ops/admin/pre-trip-checks', {
        params: onlyIssues ? { hasIssue: 'true' } : undefined,
      });
      setItems(res.data?.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [onlyIssues]);

  const failedChecks = (r: PreTripRow): string[] => {
    return Object.keys(CHECK_LABELS).filter((k) => (r as any)[k] === false).map((k) => CHECK_LABELS[k]);
  };

  const issueCount = useMemo(() => items.filter((r) => r.hasIssue).length, [items]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-indigo-500" /> Araç Kontrol Raporları
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Şoförün sefer öncesi doldurduğu 13 maddelik kontrol — eksikler kırmızı.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setOnlyIssues(!onlyIssues)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
            onlyIssues ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          {onlyIssues ? '⚠ Sadece Eksikler' : 'Tümünü Göster'}
        </button>
        {issueCount > 0 && !onlyIssues && (
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
            ⚠ {issueCount} raporda eksik bildirildi
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <Clipboard className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Kayıt yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const failed = failedChecks(r);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 ${
                  r.hasIssue ? 'border-l-4 border-l-rose-500 border-rose-200 dark:border-rose-500/30' : 'border-slate-200/80 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    r.hasIssue ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {r.hasIssue ? <AlertTriangle className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-black text-slate-900 dark:text-white">
                        {r.hasIssue ? `${failed.length} eksik` : 'Tüm kontroller OK'}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {new Date(r.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 font-medium flex-wrap">
                      {r.driver && <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {r.driver.name}</span>}
                      {r.trip && <span className="inline-flex items-center gap-1"><Car className="w-3 h-3" /> {r.trip.plate} · {r.trip.route}</span>}
                      {r.odometerKm != null && <span>Km: <strong className="text-slate-700 dark:text-zinc-200">{r.odometerKm.toLocaleString('tr-TR')}</strong></span>}
                      {r.fuelLevelPercent != null && <span>Yakıt: <strong className="text-slate-700 dark:text-zinc-200">%{r.fuelLevelPercent}</strong></span>}
                    </div>
                    {r.hasIssue && (
                      <>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {failed.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
                              ⚠ {f}
                            </span>
                          ))}
                        </div>
                        {r.issueNote && (
                          <div className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20">
                            <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold italic">Şoför notu: "{r.issueNote}"</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Shared
// ═════════════════════════════════════════════════════════════

function StatPill({ label, count, total, color }: { label: string; count: number; total: number; color: 'amber' | 'emerald' | 'rose' }) {
  const cls = color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    : color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
      <p className="text-2xl font-black tracking-tight mt-1">{count}</p>
      <p className="text-xs font-bold tabular-nums">₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
    </div>
  );
}

function StatusChip({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  const meta = status === 'APPROVED' ? { label: 'Onaylı', cls: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' }
    : status === 'REJECTED' ? { label: 'Reddedildi', cls: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' }
    : { label: 'Bekliyor', cls: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
