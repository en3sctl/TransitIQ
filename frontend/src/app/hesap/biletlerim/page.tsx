"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import { Loader2, Ticket, LogOut, ArrowRight, CalendarDays, MapPin, Armchair, Download, Search, CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/yeni_logo.png" alt="TransitIQ" width={160} height={87} priority className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Search className="w-4 h-4" /> Bilet Ara
            </Link>
            <ModeToggle />
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                Merhaba, {user?.name?.split(' ')[0] || 'Yolcu'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                Buradan tüm biletlerini yönetebilirsin.
              </p>
            </div>
          </div>
        </div>

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
                    <button
                      onClick={() => downloadPdf(b.pnrCode)}
                      className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors hover:bg-black dark:hover:bg-white"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
