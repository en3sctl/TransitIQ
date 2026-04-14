"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Ticket, ArrowRight, CalendarDays, MapPin, Armchair, Download, Printer, ShieldCheck } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import api from "@/lib/api";

interface GuestTicket {
  pnrCode: string;
  status: string;
  pricePaid: string;
  bookingTime: string;
  passenger: { name: string; contactEmail: string; contactPhone: string };
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

export default function GuestLookupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<GuestTicket | null>(null);
  const [form, setForm] = useState({ pnrCode: "", email: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTicket(null);

    try {
      const res = await api.post("/auth/customer/lookup", {
        pnrCode: form.pnrCode.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
      });
      setTicket(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Bilet bulunamadı.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!ticket) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.open(`${apiBase}/tickets/${encodeURIComponent(ticket.pnrCode)}/pdf`, '_blank');
  };

  const printPdf = () => {
    if (!ticket) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const pdfUrl = `${apiBase}/tickets/${encodeURIComponent(ticket.pnrCode)}/pdf`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '-10000px';
    iframe.style.bottom = '-10000px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = pdfUrl;
    iframe.onload = () => {
      setTimeout(() => {
        try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
        catch { window.open(pdfUrl, '_blank'); }
      }, 500);
    };
    document.body.appendChild(iframe);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <BrandLogo width={200} height={109} priority className="h-11 w-auto" />
          </Link>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Bilet Takibi</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              PNR ve email ile güvenli sorgulama
            </p>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Lookup Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 md:p-10 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Search className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Biletini Bul</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">PNR kodunu ve email adresini gir.</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <input
                  id="pnr"
                  placeholder=" "
                  value={form.pnrCode}
                  maxLength={11}
                  onChange={(e) => {
                    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                    // Auto-insert dash after "TX" if user is typing forward
                    if (v.length === 2 && v === 'TX' && form.pnrCode.length === 1) {
                      v = 'TX-';
                    } else if (v.length >= 3 && v.startsWith('TX') && v[2] !== '-') {
                      v = 'TX-' + v.substring(2).replace(/-/g, '');
                    }
                    setForm({ ...form, pnrCode: v });
                  }}
                  required
                  className="peer w-full px-5 py-5 pt-7 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 bg-white text-slate-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 font-mono font-bold tracking-wider uppercase"
                />
                <label htmlFor="pnr" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5">
                  PNR KODU (TX-XXXXXXXX)
                </label>
              </div>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="peer w-full px-5 py-5 pt-7 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 bg-white text-slate-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 font-medium"
                />
                <label htmlFor="email" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5">
                  E-POSTA ADRESİ
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : (<><Search size={18} /><span>Biletimi Bul</span></>)}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Hesabın var mı?{" "}
              <Link href="/hesap/giris" className="text-indigo-600 font-bold hover:underline">
                Giriş yap
              </Link>
              {" • "}
              <Link href="/hesap/kayit" className="text-indigo-600 font-bold hover:underline">
                Hesap oluştur
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Ticket Result */}
        <AnimatePresence>
          {ticket && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
              className="mt-8 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNR</p>
                    <p className="font-mono font-black text-xl text-slate-900 dark:text-white tracking-wider">{ticket.pnrCode}</p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                  {ticket.status === 'CONFIRMED' ? 'Onaylandı' : ticket.status}
                </span>
              </div>

              {/* Trip Summary */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-6 mb-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">KALKIŞ</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{ticket.trip.origin.city}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">{ticket.trip.origin.name}</p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-2">{fTime(ticket.trip.departureTime)}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">VARIŞ</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{ticket.trip.destination.city}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">{ticket.trip.destination.name}</p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-2">
                      {ticket.trip.estimatedArrival ? fTime(ticket.trip.estimatedArrival) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <CalendarDays className="w-3 h-3" /> TARİH
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{fDate(ticket.trip.departureTime)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Armchair className="w-3 h-3" /> KOLTUK
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{ticket.seat.number} · {ticket.seat.type === 'VIP' ? 'VIP' : 'Standart'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3" /> OTOBÜS
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{ticket.trip.busInfo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">YOLCU</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{ticket.passenger.name}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={downloadPdf}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors text-sm"
                >
                  <Download className="w-4 h-4" /> PDF İndir
                </button>
                <button
                  onClick={printPdf}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold px-6 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-sm transition-colors text-sm"
                >
                  <Printer className="w-4 h-4" /> Yazdır
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
