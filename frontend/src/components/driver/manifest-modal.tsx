"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, Users, CheckCircle2, Clock, XCircle, ScanLine, Phone, Armchair, Search, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { QRScanner } from "./qr-scanner";
import api from "@/lib/api";

interface Passenger {
  bookingId: string;
  pnrCode: string;
  passengerName: string;
  passengerTcNo: string;
  contactPhone: string;
  seatNumber: number;
  seatType: string;
  pricePaid: number;
  boardingStatus: 'PENDING' | 'BOARDED' | 'NO_SHOW';
  boardedAt: string | null;
}

interface Manifest {
  trip: {
    id: string;
    status: string;
    departureTime: string;
    origin: { city: string; name: string };
    destination: { city: string; name: string };
    vehicle: { registrationPlate: string; model: string | null; capacity: number };
  };
  stats: { total: number; boarded: number; pending: number; noShow: number };
  passengers: Passenger[];
}

interface Props {
  tripId: string | null;
  onClose: () => void;
}

const STATUS_STYLES: Record<Passenger['boardingStatus'], { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Bekliyor', color: 'slate', icon: Clock },
  BOARDED: { label: 'Bindi', color: 'emerald', icon: CheckCircle2 },
  NO_SHOW: { label: 'Gelmedi', color: 'rose', icon: XCircle },
};

const STATUS_COLORS: Record<string, string> = {
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

export function ManifestModal({ tripId, onClose }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'boarded' | 'noshow'>('all');

  const load = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const res = await api.get(`/driver-ops/trips/${tripId}/manifest`);
      setManifest(res.data);
    } catch {
      toast.error('Manifest yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) load();
  }, [tripId, load]);

  async function checkIn(pnr: string) {
    try {
      const res = await api.post(`/driver-ops/check-in/${pnr}`);
      if (res.data.alreadyBoarded) {
        toast.info('Bu yolcu zaten bindi');
      } else {
        toast.success(`${res.data.passengerName} — Koltuk ${res.data.seatNumber} — Bindi ✓`);
      }
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Check-in başarısız');
    }
  }

  async function markNoShow(pnr: string) {
    if (!confirm('Yolcu gelmedi olarak işaretlensin mi?')) return;
    try {
      await api.post(`/driver-ops/no-show/${pnr}`);
      toast.success('Gelmedi olarak işaretlendi');
      load();
    } catch {
      toast.error('İşlem başarısız');
    }
  }

  async function reset(pnr: string) {
    try {
      await api.post(`/driver-ops/reset-boarding/${pnr}`);
      toast.success('Durum sıfırlandı');
      load();
    } catch {
      toast.error('İşlem başarısız');
    }
  }

  if (!tripId) return null;

  const filtered = (manifest?.passengers || []).filter((p) => {
    if (filter === 'pending' && p.boardingStatus !== 'PENDING') return false;
    if (filter === 'boarded' && p.boardingStatus !== 'BOARDED') return false;
    if (filter === 'noshow' && p.boardingStatus !== 'NO_SHOW') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.passengerName.toLowerCase().includes(q) ||
        p.pnrCode.toLowerCase().includes(q) ||
        p.passengerTcNo.includes(q) ||
        p.seatNumber.toString() === q
      );
    }
    return true;
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl h-[92vh] sm:h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800 shrink-0">
            <div>
              <h2 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">Yolcu Manifestosu</h2>
              {manifest && (
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                  {manifest.trip.origin.city} → {manifest.trip.destination.city} · {manifest.trip.vehicle.registrationPlate}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : !manifest ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Veri yok</div>
          ) : (
            <>
              {/* Stats + QR scan */}
              <div className="p-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <button
                    onClick={() => setFilter('all')}
                    className={`p-2.5 rounded-xl text-left transition-colors ${filter === 'all' ? 'bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30' : 'bg-slate-50 dark:bg-zinc-800/50'}`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Toplam</p>
                    <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">{manifest.stats.total}</p>
                  </button>
                  <button
                    onClick={() => setFilter('boarded')}
                    className={`p-2.5 rounded-xl text-left transition-colors ${filter === 'boarded' ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-2 ring-emerald-500/30' : 'bg-slate-50 dark:bg-zinc-800/50'}`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Bindi</p>
                    <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">{manifest.stats.boarded}</p>
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`p-2.5 rounded-xl text-left transition-colors ${filter === 'pending' ? 'bg-slate-100 dark:bg-zinc-700 ring-2 ring-slate-400/30' : 'bg-slate-50 dark:bg-zinc-800/50'}`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Bekliyor</p>
                    <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">{manifest.stats.pending}</p>
                  </button>
                  <button
                    onClick={() => setFilter('noshow')}
                    className={`p-2.5 rounded-xl text-left transition-colors ${filter === 'noshow' ? 'bg-rose-50 dark:bg-rose-500/10 ring-2 ring-rose-500/30' : 'bg-slate-50 dark:bg-zinc-800/50'}`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">Gelmedi</p>
                    <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">{manifest.stats.noShow}</p>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
                  >
                    <ScanLine className="w-4 h-4" /> QR Tara / PNR Gir
                  </button>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Ad, PNR, TC, koltuk..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Passenger list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Eşleşen yolcu yok</p>
                  </div>
                ) : (
                  filtered.map((p) => {
                    const meta = STATUS_STYLES[p.boardingStatus];
                    const StatusIcon = meta.icon;
                    return (
                      <div
                        key={p.bookingId}
                        className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 flex items-center gap-3 ${
                          p.boardingStatus === 'NO_SHOW' ? 'border-rose-100 dark:border-rose-500/20 opacity-70' : 'border-slate-200/80 dark:border-zinc-800'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex flex-col items-center justify-center shrink-0">
                          <Armchair className="w-3 h-3 text-indigo-500" />
                          <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 leading-none">{p.seatNumber}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">{p.passengerName}</p>
                            <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{p.pnrCode}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1 flex-wrap">
                            <span>TC: •••• {p.passengerTcNo.slice(-4)}</span>
                            {p.contactPhone && <span className="inline-flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {p.contactPhone}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[meta.color]}`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {meta.label}
                          </span>
                          {p.boardingStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => checkIn(p.pnrCode)}
                                aria-label="Bindi işaretle"
                                className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 flex items-center justify-center"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => markNoShow(p.pnrCode)}
                                aria-label="Gelmedi işaretle"
                                className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center justify-center"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {(p.boardingStatus === 'BOARDED' || p.boardingStatus === 'NO_SHOW') && (
                            <button
                              onClick={() => reset(p.pnrCode)}
                              aria-label="Durumu sıfırla"
                              className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center justify-center"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* QR Scanner overlay */}
        <QRScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetect={(pnr) => { setScannerOpen(false); checkIn(pnr); }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
