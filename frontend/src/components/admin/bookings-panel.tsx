"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, Search, RefreshCw, Ticket, CheckCircle2, XCircle, Clock,
  ArrowRight, Download, X, AlertTriangle, Phone, Mail, CreditCard,
  CalendarDays, MapPin, Armchair, Filter,
} from "lucide-react";
import api from "@/lib/api";

interface Booking {
  id: string;
  pnrCode: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  pricePaid: string;
  bookingTime: string;
  passengerName: string;
  passengerTcNo: string;
  contactEmail: string;
  contactPhone: string;
  paymentId: string | null;
  seat: { number: number; type: string };
  trip: {
    id: string;
    departureTime: string;
    estimatedArrival: string | null;
    status: string;
    origin: { city: string; name: string };
    destination: { city: string; name: string };
    vehicle: { plate: string; layoutType: string };
  };
}

interface Stats {
  confirmed: number;
  cancelled: number;
  noShow: number;
}

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function fDate(s: string) { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fTime(s: string) { return new Date(s).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }

const PAGE_SIZE = 25;

export function AdminBookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({ confirmed: 0, cancelled: 0, noShow: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  // Detail drawer state
  const [selected, setSelected] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelWithRefund, setCancelWithRefund] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        skip: String(page * PAGE_SIZE),
        take: String(PAGE_SIZE),
      };
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (searchQuery) params.q = searchQuery;

      const res = await api.get('/booking/admin/bookings', { params });
      setBookings(res.data.bookings);
      setStats(res.data.stats);
      setTotal(res.data.total);
    } catch {
      toast.error('Biletler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, fromDate, toDate, searchQuery]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearchQuery(searchInput.trim());
  };

  const clearFilters = () => {
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setSearchInput('');
    setSearchQuery('');
    setPage(0);
  };

  const downloadPdf = (pnr: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.open(`${apiBase}/tickets/${encodeURIComponent(pnr)}/pdf`, '_blank');
  };

  const confirmCancel = async () => {
    if (!selected) return;
    setCancelling(true);
    try {
      const res = await api.post(`/booking/admin/bookings/${selected.id}/cancel`, {
        refund: cancelWithRefund,
      });
      toast.success(res.data.message || 'Bilet iptal edildi');
      setShowCancelConfirm(false);
      setSelected(null);
      fetchBookings();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'İptal başarısız';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setCancelling(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Toplam" value={total} icon={<Ticket className="w-4 h-4" />} color="indigo" />
        <StatCard label="Onaylı" value={stats.confirmed} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" />
        <StatCard label="İptal" value={stats.cancelled} icon={<XCircle className="w-4 h-4" />} color="rose" />
        <StatCard label="Gelmedi" value={stats.noShow} icon={<Clock className="w-4 h-4" />} color="amber" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <form onSubmit={handleSearch} className="flex-1 relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="PNR, ad, email, TC veya telefon..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 outline-none"
            >
              <option value="">Tüm Durumlar</option>
              <option value="CONFIRMED">Onaylı</option>
              <option value="CANCELLED">İptal</option>
              <option value="NO_SHOW">Gelmedi</option>
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold"
            />
            <span className="text-xs text-slate-400">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold"
            />

            {(statusFilter || fromDate || toDate || searchQuery) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" /> Temizle
              </button>
            )}

            <button
              onClick={fetchBookings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-20 flex items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
          <Ticket className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Kayıt bulunamadı</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Filtrelerini değiştirmeyi dene.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800">
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">PNR / Yolcu</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Güzergah</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Sefer</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Koltuk</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Tutar</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Durum</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">{b.pnrCode}</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">{b.passengerName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{b.trip.origin.city}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{b.trip.destination.city}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{fDate(b.trip.departureTime)}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">{fTime(b.trip.departureTime)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-black text-slate-700 dark:text-zinc-300">
                          <Armchair className="w-3 h-3" /> {b.seat.number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-black text-slate-900 dark:text-white">₺{Number(b.pricePaid).toLocaleString('tr-TR')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ArrowRight className="w-4 h-4 text-slate-400 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} / {total} kayıt
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Önceki
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-stretch justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white dark:bg-zinc-900 overflow-y-auto border-l border-slate-200 dark:border-zinc-800 shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bilet Detayı</p>
                  <p className="font-mono text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider">{selected.pnrCode}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <StatusBadge status={selected.status} large />

                {/* Trip */}
                <DetailSection title="Güzergah">
                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">KALKIŞ</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{selected.trip.origin.city}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{selected.trip.origin.name}</p>
                        <p className="text-base font-black text-slate-900 dark:text-white mt-2">{fTime(selected.trip.departureTime)}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">VARIŞ</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{selected.trip.destination.city}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{selected.trip.destination.name}</p>
                        <p className="text-base font-black text-slate-900 dark:text-white mt-2">
                          {selected.trip.estimatedArrival ? fTime(selected.trip.estimatedArrival) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700 grid grid-cols-3 gap-3">
                      <InfoPill icon={<CalendarDays className="w-3 h-3" />} label="Tarih" value={fDate(selected.trip.departureTime)} />
                      <InfoPill icon={<Armchair className="w-3 h-3" />} label="Koltuk" value={`${selected.seat.number} ${selected.seat.type === 'VIP' ? '(VIP)' : ''}`} />
                      <InfoPill icon={<MapPin className="w-3 h-3" />} label="Otobüs" value={selected.trip.vehicle.plate} />
                    </div>
                  </div>
                </DetailSection>

                {/* Passenger */}
                <DetailSection title="Yolcu Bilgileri">
                  <InfoRow label="Ad Soyad" value={selected.passengerName} />
                  <InfoRow label="T.C. Kimlik No" value={selected.passengerTcNo} />
                </DetailSection>

                {/* Contact */}
                <DetailSection title="İletişim">
                  <InfoRow label="E-posta" value={selected.contactEmail} icon={<Mail className="w-3.5 h-3.5" />} />
                  <InfoRow label="Telefon" value={selected.contactPhone} icon={<Phone className="w-3.5 h-3.5" />} />
                </DetailSection>

                {/* Payment */}
                <DetailSection title="Ödeme">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Ödenen Tutar</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">₺{Number(selected.pricePaid).toLocaleString('tr-TR')}</span>
                  </div>
                  {selected.paymentId && (
                    <InfoRow label="Iyzico Payment ID" value={selected.paymentId} icon={<CreditCard className="w-3.5 h-3.5" />} mono />
                  )}
                  <p className="text-[10px] text-slate-400 font-semibold mt-2">Rezervasyon: {fDate(selected.bookingTime)} {fTime(selected.bookingTime)}</p>
                </DetailSection>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => downloadPdf(selected.pnrCode)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-bold text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" /> PDF İndir
                  </button>
                  {selected.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Bileti İptal Et
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !cancelling && setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-7 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                  Bileti iptal etmek istediğine emin misin?
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">{selected.pnrCode}</span> — {selected.passengerName}
                </p>
              </div>

              <div className="mx-7 mb-5 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cancelWithRefund}
                    onChange={(e) => setCancelWithRefund(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-indigo-600"
                    disabled={!selected.paymentId}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Iyzico üzerinden para iadesi yap
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {selected.paymentId
                        ? `₺${selected.pricePaid} yolcunun kartına geri gönderilir (3-7 iş günü).`
                        : 'Bu bilette ödeme ID yok, otomatik iade yapılamaz.'}
                    </p>
                  </div>
                </label>
              </div>

              <div className="px-7 pb-7 flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  {cancelling ? 'İptal ediliyor...' : cancelWithRefund ? 'İptal Et + İade' : 'İptal Et'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  const config: Record<string, { label: string; classes: string }> = {
    CONFIRMED: { label: 'Onaylı', classes: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    CANCELLED: { label: 'İptal', classes: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
    NO_SHOW: { label: 'Gelmedi', classes: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  };
  const c = config[status] || { label: status, classes: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-widest ${c.classes} ${large ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'}`}>
      {c.label}
    </span>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0">
      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
        {icon}{label}
      </span>
      <span className={`text-sm font-bold text-slate-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">{icon}{label}</p>
      <p className="text-xs font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
