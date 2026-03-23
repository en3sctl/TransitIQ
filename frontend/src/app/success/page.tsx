"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import confetti from "canvas-confetti";
import {
  CheckCircle,
  MapPin,
  CalendarDays,
  Bus,
  User,
  Armchair,
  CreditCard,
  Download,
  Clock,
  Ticket,
  Loader2,
} from "lucide-react";

/* ── Types ── */
interface TicketData {
  pnrCode: string;
  status: string;
  pricePaid: string;
  bookingTime: string;
  passenger: { name: string; email: string };
  seat: { number: string; type: string };
  trip: {
    departureTime: string;
    estimatedArrival: string | null;
    origin: { name: string; city: string };
    destination: { name: string; city: string };
  };
}

/* ── Jagged tear edge generators ── */
const jaggedRight = (color: string) =>
  `radial-gradient(circle at 0px 8px, transparent 6px, ${color} 6.5px)`;
const jaggedLeft = (color: string) =>
  `radial-gradient(circle at 8px 8px, transparent 6px, ${color} 6.5px)`;

const spring = { type: "spring" as const, stiffness: 100, damping: 17, mass: 1.1 };

/* ── Date formatter ── */
function formatDate(iso: string) {
  const d = new Date(iso);
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatSeatType(type: string) {
  switch (type) {
    case "VIP": return "VIP 2+1";
    case "STANDARD": return "Standart 2+1";
    default: return type;
  }
}

/* ── Paper texture SVG (inlined, tiny) ── */
const paperTexture = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
function SuccessContent() {
  const searchParams = useSearchParams();
  const pnr = searchParams.get("pnr");

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTorn, setIsTorn] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isDark, setIsDark] = useState(true);

  /* Theme detection */
  useEffect(() => {
    const root = document.documentElement;
    const check = () =>
      setIsDark(
        root.classList.contains("dark") ||
          (!root.classList.contains("light") &&
            window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    check();
    const obs = new MutationObserver(check);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", check);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", check);
    };
  }, []);

  /* Fetch real ticket data */
  useEffect(() => {
    if (!pnr) {
      setError("PNR kodu bulunamadı.");
      setIsLoading(false);
      return;
    }

    const fetchTicket = async () => {
      try {
        const res = await fetch(`http://localhost:3000/booking/ticket/${encodeURIComponent(pnr)}`);
        if (!res.ok) throw new Error("Bilet bulunamadı");
        const data = await res.json();
        setTicketData(data);
      } catch {
        setError("Bilet bilgileri yüklenemedi. Lütfen tekrar deneyin.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [pnr]);

  /* Confetti + tear — only AFTER data loads */
  useEffect(() => {
    if (!ticketData) return;

    const burst = (opts: confetti.Options) =>
      confetti({ zIndex: 9999, ...opts });

    burst({
      particleCount: 100,
      spread: 100,
      startVelocity: 50,
      origin: { x: 0.3, y: 0.55 },
      colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#ffffff"],
    });
    burst({
      particleCount: 70,
      spread: 120,
      startVelocity: 42,
      origin: { x: 0.7, y: 0.55 },
      colors: ["#059669", "#047857", "#10b981", "#ffffff"],
    });

    const t1 = setTimeout(() => setIsTorn(true), 1200);
    const t2 = setTimeout(() => setShowQR(true), 1550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ticketData]);

  const ticketColorDark = "#18181b";
  const ticketColorLight = "#ffffff";
  const tearColor = isDark ? ticketColorDark : ticketColorLight;

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col items-center justify-center gap-5 transition-colors">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 flex items-center justify-center"
        >
          <Bus className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
        </motion.div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm tracking-wide">Bilet bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !ticketData) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Ticket className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-slate-600 dark:text-zinc-400 text-sm">{error}</p>
      </div>
    );
  }

  const t = ticketData;

  /* ══════════════════════════════════════════════
     RENDER — Horizontal Boarding Pass
     ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative transition-colors duration-300">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 800px 500px at 50% 45%, rgba(16,185,129,0.07) 0%, transparent 70%)"
            : "radial-gradient(ellipse 800px 500px at 50% 45%, rgba(16,185,129,0.10) 0%, transparent 70%)",
        }}
      />
      {/* Road lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.015]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 60px, currentColor 60px, currentColor 62px)",
          }}
        />
      </div>

      {/* ── HORIZONTAL TICKET ── */}
      <div className="relative" style={{ width: "min(660px, calc(100vw - 2rem))", height: 260 }}>
        {/* ════════════════════════════════════
            QR REVEAL LAYER (behind both stubs)
            ════════════════════════════════════ */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 130, damping: 16 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center"
            >
              {/* Success badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-3"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-widest uppercase">
                  Ödeme Başarılı
                </span>
              </motion.div>

              {/* QR Code */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 14 }}
                className="relative"
              >
                <div
                  className="absolute -inset-4 rounded-2xl pointer-events-none"
                  style={{
                    boxShadow: isDark
                      ? "0 0 45px rgba(16,185,129,0.20), 0 0 90px rgba(16,185,129,0.08)"
                      : "0 0 45px rgba(16,185,129,0.14), 0 0 90px rgba(16,185,129,0.05)",
                  }}
                />
                <div className="bg-white rounded-xl p-3.5 shadow-lg dark:shadow-emerald-900/20">
                  <QRCode
                    value={t.pnrCode}
                    size={110}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#18181b"
                  />
                </div>
              </motion.div>

              {/* PNR label */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-2.5 flex items-center gap-1.5"
              >
                <Ticket className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                <span className="text-slate-400 dark:text-zinc-500 text-[10px] tracking-widest">
                  PNR
                </span>
                <span className="text-slate-800 dark:text-white font-mono font-bold text-sm tracking-[0.18em]">
                  {t.pnrCode}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════
            LEFT STUB — Route & Schedule
            ════════════════════════════════════ */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: isTorn ? -180 : 0 }}
          transition={spring}
          className="absolute left-0 top-0 z-20"
          style={{ width: "60%", height: "100%" }}
        >
          <div
            className="relative h-full bg-white dark:bg-zinc-900 rounded-l-2xl border border-r-0 border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors duration-300 overflow-hidden"
          >
            {/* Jagged right edge (tear) */}
            <div
              className="absolute top-0 right-0 w-2 h-full z-10"
              style={{
                backgroundImage: jaggedRight(tearColor),
                backgroundSize: "8px 16px",
                backgroundRepeat: "repeat-y",
                backgroundPosition: "right center",
              }}
            />
            {/* Paper texture */}
            <div
              className="absolute inset-0 rounded-l-2xl pointer-events-none opacity-[0.015] dark:opacity-[0.025]"
              style={{ backgroundImage: paperTexture }}
            />

            <div className="relative h-full flex flex-col justify-between px-5 py-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Bus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-slate-900 dark:text-white font-bold text-base block leading-tight">
                      TransitIQ
                    </span>
                    <span className="text-slate-400 dark:text-zinc-600 text-[9px] font-medium tracking-[0.2em] uppercase">
                      Boarding Pass
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 dark:text-zinc-600 text-[9px] tracking-widest uppercase block">
                    PNR
                  </span>
                  <span className="text-slate-700 dark:text-zinc-300 font-mono text-xs font-bold tracking-wider">
                    {t.pnrCode}
                  </span>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center gap-3 my-auto">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-[0.15em]">
                      Kalkış
                    </span>
                  </div>
                  <p className="text-slate-900 dark:text-white text-lg sm:text-xl font-bold tracking-tight leading-tight">
                    {t.trip.origin.city}
                  </p>
                </div>

                <div className="flex items-center gap-1 px-1 flex-shrink-0">
                  <div className="w-6 sm:w-10 h-px bg-slate-300 dark:bg-zinc-700" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0"
                  >
                    <Bus className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  </motion.div>
                  <div className="w-6 sm:w-10 h-px bg-slate-300 dark:bg-zinc-700" />
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center gap-1 mb-0.5 justify-end">
                    <MapPin className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-[0.15em]">
                      Varış
                    </span>
                  </div>
                  <p className="text-slate-900 dark:text-white text-lg sm:text-xl font-bold tracking-tight leading-tight">
                    {t.trip.destination.city}
                  </p>
                </div>
              </div>

              {/* Schedule row */}
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1 mb-px">
                    <CalendarDays className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
                    <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest">
                      Tarih
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-white text-xs font-semibold">
                    {formatDate(t.trip.departureTime)}
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1 mb-px">
                    <Clock className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
                    <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest">
                      Saat
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-white text-xs font-semibold">
                    {formatTime(t.trip.departureTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ════════════════════════════════════
            RIGHT STUB — Passenger & Fare
            ════════════════════════════════════ */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: isTorn ? 180 : 0 }}
          transition={spring}
          className="absolute right-0 top-0 z-20"
          style={{ width: "40%", height: "100%" }}
        >
          <div
            className="relative h-full bg-white dark:bg-zinc-900 rounded-r-2xl border border-l-0 border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors duration-300 overflow-hidden"
          >
            {/* Jagged left edge (tear) */}
            <div
              className="absolute top-0 left-0 w-2 h-full z-10"
              style={{
                backgroundImage: jaggedLeft(tearColor),
                backgroundSize: "8px 16px",
                backgroundRepeat: "repeat-y",
                backgroundPosition: "left center",
              }}
            />
            {/* Paper texture */}
            <div
              className="absolute inset-0 rounded-r-2xl pointer-events-none opacity-[0.015] dark:opacity-[0.025]"
              style={{ backgroundImage: paperTexture }}
            />

            <div className="relative h-full flex flex-col justify-between px-4 py-4 pl-5">
              {/* Passenger */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <User className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
                  <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest">
                    Yolcu
                  </span>
                </div>
                <p className="text-slate-800 dark:text-white text-sm font-semibold truncate">
                  {t.passenger.name}
                </p>
              </div>

              {/* Seat + Type */}
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1 mb-px">
                    <Armchair className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
                    <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest">
                      Koltuk
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-white text-xs font-semibold">
                    {t.seat.number}
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1 mb-px">
                    <Ticket className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
                    <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest">
                      Tip
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-white text-xs font-semibold">
                    {formatSeatType(t.seat.type)}
                  </p>
                </div>
              </div>

              {/* Price + Status */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <CreditCard className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
                      <span className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest">
                        Toplam
                      </span>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                      {Number(t.pricePaid).toFixed(0)} TL
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-600 dark:text-emerald-500 text-[10px] font-medium">
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── PDF Download ── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isTorn ? 1 : 0, y: isTorn ? 0 : 20 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 120, damping: 16 }}
        className="mt-12 relative z-30 flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 dark:shadow-emerald-500/15 transition-all duration-200 cursor-pointer active:scale-[0.97]"
      >
        <Download className="w-5 h-5" />
        <span className="text-sm tracking-wide">Bileti PDF Olarak İndir</span>
      </motion.button>
    </div>
  );
}

/* ── Suspense wrapper (required for useSearchParams) ── */
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
