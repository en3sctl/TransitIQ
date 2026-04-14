"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Ticket, LogOut, ArrowRight, CalendarDays, MapPin, Armchair, Download, Search, CheckCircle2, XCircle, Clock, User, AlertTriangle, X, MessageCircle } from "lucide-react";
import { AccountLayout } from "@/components/hesap/account-layout";
import { ModeToggle } from "@/components/mode-toggle";
import { toast } from "sonner";
import api from "@/lib/api";

interface MyBooking {
  id: string;
  pnrCode: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  pricePaid: string;
  bookingTime: string;
  passengerName: string;
  seat: { number: number; type: string };
  trip: {
    departureTime: string;
    estimatedArrival: string | null;
    origin: { name: string; city: string };
    destination: { name: string; city: string };
    busInfo: string;
  };
}

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function fDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}
function fTime(s: string) {
  return new Date(s).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function MyTicketsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<MyBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/hesap/giris');
      return;
    }
    if (user.role !== 'PASSENGER') {
      router.push('/');
      return;
    }

    (async () => {
      try {
        const res = await api.get('/auth/customer/bookings');
        setBookings(res.data);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const now = Date.now();
  const filtered = bookings.filter((b) => {
    const depTime = new Date(b.trip.departureTime).getTime();
    if (filter === 'cancelled') return b.status === 'CANCELLED';
    if (filter === 'past') return b.status === 'CONFIRMED' && depTime < now;
    return b.status === 'CONFIRMED' && depTime >= now;
  });

  const counts = {
    upcoming: bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.trip.departureTime).getTime() >= now).length,
    past: bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.trip.departureTime).getTime() < now).length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  const downloadPdf = (pnr: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.open(`${apiBase}/tickets/${encodeURIComponent(pnr)}/pdf`, '_blank');
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await api.post(`/auth/customer/bookings/${cancelTarget.id}/cancel`);
      toast.success(res.data.message || 'Bilet iptal edildi');
      // Refresh bookings
      const refreshed = await api.get('/auth/customer/bookings');
      setBookings(refreshed.data);
      setCancelTarget(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'İptal başarısız oldu';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (b: MyBooking) => {
    if (b.status !== 'CONFIRMED') return false;
    const hoursLeft = (new Date(b.trip.departureTime).getTime() - Date.now()) / 3600000;
    return hoursLeft >= 6;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <AccountLayout
      title={`Merhaba, ${user?.name?.split(' ')[0] || 'Yolcu'}`}
      subtitle="Buradan tüm biletlerini yönetebilirsin."
    >
      <>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Gelecek', count: counts.upcoming, icon: Clock, color: 'indigo' },
            { label: 'Geçmiş', count: counts.past, icon: CheckCircle2, color: 'emerald' },
            { label: 'İptal', count: counts.cancelled, icon: XCircle, color: 'rose' },
          ].map(({ label, count, icon: Icon, color }) => (
            <div
              key={label}
              className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-zinc-800">
          {[
            { id: 'upcoming', label: 'Gelecek Seferler' },
            { id: 'past', label: 'Geçmiş Seferler' },
            { id: 'cancelled', label: 'İptal Edilen' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as typeof filter)}
              className={`px-5 py-3 text-sm font-bold transition-colors relative ${
                filter === t.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              {t.label}
              {filter === t.id && (
                <motion.div
                  layoutId="filter-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {filter === 'upcoming' ? 'Gelecek seferin yok' : filter === 'past' ? 'Geçmiş seferin yok' : 'İptal edilmiş bilet yok'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5">
              {filter === 'upcoming' ? 'Bir sefer bul ve yola çık!' : 'Henüz burada gösterilecek bir şey yok.'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold px-6 py-3 rounded-xl text-sm"
              >
                <Search className="w-4 h-4" /> Sefer Ara
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 tracking-wider">{b.pnrCode}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : b.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}>
                        {b.status === 'CONFIRMED' ? 'Onaylandı' : b.status === 'CANCELLED' ? 'İptal' : 'Gelmedi'}
                      </span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{b.trip.origin.city}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{fTime(b.trip.departureTime)}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{b.trip.destination.city}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          {b.trip.estimatedArrival ? fTime(b.trip.estimatedArrival) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                      <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {fDate(b.trip.departureTime)}</span>
                      <span className="flex items-center gap-1.5"><Armchair className="w-3.5 h-3.5" /> Koltuk {b.seat.number}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {b.trip.busInfo}</span>
                    </div>
                  </div>

                  {/* Right: Price + Actions */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 lg:border-l lg:pl-5 lg:border-slate-100 dark:lg:border-zinc-800">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ödenen</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">₺{Number(b.pricePaid).toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="flex lg:flex-col gap-2 lg:w-full">
                      <button
                        onClick={() => downloadPdf(b.pnrCode)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors hover:bg-black dark:hover:bg-white"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`TransitIQ Biletim\n\n${b.trip.origin.city} → ${b.trip.destination.city}\n${fDate(b.trip.departureTime)} · ${fTime(b.trip.departureTime)}\nYolcu: ${b.passengerName}\nPNR: ${b.pnrCode}\n\nBilet takibi: https://transitiq.com/bilet-takip`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/20"
                      >
                        <MessageCircle className="w-4 h-4" /> Paylaş
                      </a>
                      {canCancel(b) && (
                        <button
                          onClick={() => setCancelTarget(b)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20"
                        >
                          <XCircle className="w-4 h-4" /> İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !cancelling && setCancelTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Close button */}
              {!cancelling && (
                <button
                  onClick={() => setCancelTarget(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Header */}
              <div className="p-7 pb-5 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Bileti iptal etmek istediğine emin misin?</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">{cancelTarget.pnrCode}</span> numaralı biletin iptal edilecek ve iade süreci başlatılacak.
                </p>
              </div>

              {/* Trip Info */}
              <div className="mx-7 mb-5 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1">Sefer</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">
                  {cancelTarget.trip.origin.city} → {cancelTarget.trip.destination.city}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Koltuk {cancelTarget.seat.number} · ₺{Number(cancelTarget.pricePaid).toLocaleString('tr-TR')}
                </p>
              </div>

              {/* Notice */}
              <div className="mx-7 mb-5 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  İade tutarı 3-7 iş günü içinde ödeme yaptığın kartına yansır. İptal işlemi geri alınamaz.
                </p>
              </div>

              {/* Actions */}
              <div className="px-7 pb-7 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  {cancelling ? 'İptal ediliyor...' : 'Bileti İptal Et'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AccountLayout>
  );
}
