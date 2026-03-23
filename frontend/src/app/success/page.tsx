"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import confetti from "canvas-confetti";
import { ModeToggle } from "@/components/mode-toggle";
import {
  CheckCircle, MapPin, CalendarDays, Bus, User, Armchair,
  CreditCard, Clock, Ticket, Loader2, Download, Printer,
  ShieldCheck, Headphones, Smartphone, CloudSun, ChevronRight, QrCode,
  Sun, Moon, CloudRain, Snowflake, Cloud
} from "lucide-react";

/* ── Types ── */
interface TD {
  pnrCode: string; status: string; pricePaid: string; bookingTime: string;
  passenger: { name: string; email: string };
  seat: { number: string; type: string };
  trip: {
    departureTime: string; estimatedArrival: string | null;
    origin: { name: string; city: string }; destination: { name: string; city: string };
  };
}

/* ── Helpers ── */
const sp = { type: "spring" as const, stiffness: 80, damping: 17, mass: 1.15 };
function fDate(i: string) {
  const d = new Date(i);
  return `${d.getDate()} ${["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"][d.getMonth()]} ${d.getFullYear()}`;
}
function fTime(i: string) {
  return new Date(i).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
function fSeat(t: string) {
  return t === "VIP" ? "VIP 2+1" : t === "STANDARD" ? "Standart 2+1" : t;
}

/* ══════════════════════════════════════
   MAIN
   ══════════════════════════════════════ */
function SuccessContent() {
  const searchParams = useSearchParams();
  const pnr = searchParams.get("pnr");
  const [ticketData, setTicketData] = useState<TD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTorn, setIsTorn] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [weather, setWeather] = useState<{temp: number, desc: string, isDay: boolean, code: number} | null>(null);

  /* Weather Fetch */
  useEffect(() => {
    if (!ticketData) return;
    const city = ticketData.trip.destination.city;
    (async () => {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results?.length) return;
        const { latitude, longitude } = geoData.results[0];
        
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const wData = await wRes.json();
        const cw = wData.current_weather;
        
        const wmo: Record<number, string> = {
          0: "Açık", 1: "Çoğunlukla Açık", 2: "Parçalı Bulutlu", 3: "Kapalı",
          45: "Sisli", 48: "Puslu", 51: "Hafif Çisenti", 61: "Hafif Yağmurlu",
          63: "Yağmurlu", 65: "Şiddetli Yağmur", 71: "Hafif Kar", 73: "Kar Yağışlı",
          80: "Sağanak", 95: "Fırtına"
        };
        setWeather({ temp: Math.round(cw.temperature), desc: wmo[cw.weathercode] || "Parçalı Bulutlu", isDay: cw.is_day === 1, code: cw.weathercode });
      } catch (err) { console.error(err); }
    })();
  }, [ticketData]);

  const getWeatherIcon = () => {
    if (!weather) return <CloudSun className="w-5 h-5 text-slate-400" />;
    const d = weather.desc.toLowerCase();
    if (d.includes("yağmur") || d.includes("sağanak")) return <CloudRain className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    if (d.includes("kar")) return <Snowflake className="w-5 h-5 text-blue-400 dark:text-blue-300" />;
    if (d.includes("bulut") || d.includes("sis") || d.includes("kapalı")) return <Cloud className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    return weather.isDay ? <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
  };

  /* Fetch */
  useEffect(() => {
    if (!pnr) { setError("PNR kodu bulunamadı."); setIsLoading(false); return; }
    const fb: TD = {
      pnrCode: pnr, status: "CONFIRMED", pricePaid: "450",
      bookingTime: new Date().toISOString(),
      passenger: { name: "Enes Çatal", email: "enes@transitiq.com" },
      seat: { number: "9", type: "VIP" },
      trip: {
        departureTime: "2026-03-26T10:00:00.000Z",
        estimatedArrival: "2026-03-26T15:30:00.000Z",
        origin: { name: "İstanbul Otogarı", city: "İstanbul" },
        destination: { name: "Ankara AŞTİ", city: "Ankara" },
      },
    };
    (async () => {
      try {
        const r = await fetch(`http://localhost:3000/booking/ticket/${encodeURIComponent(pnr)}`);
        if (!r.ok) throw 0;
        setTicketData(await r.json());
      } catch { setTicketData(fb); }
      finally { setIsLoading(false); }
    })();
  }, [pnr]);

  /* Confetti + tear */
  useEffect(() => {
    if (!ticketData) return;
    const b = (o: confetti.Options) => confetti({ zIndex: 9999, ...o });
    b({ particleCount: 80, spread: 70, startVelocity: 45, origin: { x: 0.35, y: 0.4 }, colors: ["#10b981", "#34d399", "#6ee7b7", "#fff"] });
    b({ particleCount: 60, spread: 100, startVelocity: 38, origin: { x: 0.65, y: 0.4 }, colors: ["#059669", "#047857", "#10b981", "#fff"] });
    const t1 = setTimeout(() => setIsTorn(true), 1200);
    const t2 = setTimeout(() => setShowQR(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ticketData]);

  /* Loading */
  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
        <Bus className="w-8 h-8 text-emerald-500 animate-pulse" />
      </div>
      <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Bilet bilgileri yükleniyor...</span>
      </div>
    </div>
  );

  /* Error */
  if (error || !ticketData) return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
        <Ticket className="w-8 h-8 text-red-400" />
      </div>
      <p className="text-slate-600 dark:text-zinc-400 text-sm">{error}</p>
    </div>
  );

  const d = ticketData;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors relative overflow-hidden">
      {/* ── Background Pattern ── */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20 hidden md:block" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #10b981 1.5px, transparent 0)`, 
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }} 
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Bus className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">TransitIQ</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Bilet Onayı</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
              Ödeme başarıyla tamamlandı
            </p>
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* ── Steps indicator ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-6 flex items-center justify-center gap-4 text-xs font-bold text-slate-400 dark:text-zinc-500">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold text-[11px]">1</span>
          <span>Sefer Seçimi</span>
        </div>
        <div className="w-8 h-px bg-emerald-300 dark:bg-emerald-800" />
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold text-[11px]">2</span>
          <span>Ödeme</span>
        </div>
        <div className="w-8 h-px bg-emerald-300 dark:bg-emerald-800" />
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold text-[11px]">3</span>
          <span>Bilet</span>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6 z-10 relative">

        {/* ════════════════════════════════════
            HORIZONTAL BOARDING PASS
            Sol: büyük parça (tüm bilgiler)
            Sağ: küçük kopar, QR belirir
            ════════════════════════════════════ */}
        <div className="relative" style={{ height: 310 }}>

          {/* QR REVEAL — sağ tarafta, kopan parçanın yerine */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 14 }}
                className="absolute top-0 z-10 flex flex-col items-center justify-center pointer-events-none"
                style={{ width: 180, height: "100%", left: "calc(100% - 250px)" }}
              >
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1.5 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">Onaylandı</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 80, damping: 12 }}
                  className="bg-white rounded-xl p-4 shadow-xl"
                >
                  <QRCode value={d.pnrCode} size={140} level="H" bgColor="#ffffff" fgColor="#09090b" />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-2.5 flex flex-col items-center">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-slate-400 dark:text-zinc-500 font-medium">PNR</span>
                  <span className="font-mono font-bold text-base tracking-[0.12em] text-slate-900 dark:text-white">{d.pnrCode}</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SOL BÜYÜK PARÇA (tüm bilgiler) — açıldığında sola kayar ── */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: isTorn ? -150 : 0 }}
            transition={sp}
            className="absolute top-0 left-0 z-20"
            style={{ width: "calc(100% - 160px)", height: "100%" }}
          >
            <div className="h-full bg-white dark:bg-zinc-900 rounded-l-2xl border border-r-0 border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
              {/* Sağ kenar perforation */}
              <div className="absolute top-3 right-0 bottom-3 w-[4px] z-10 flex flex-col justify-between">
                {Array.from({ length: 22 }).map((_, i) => (
                  <div key={i} className="w-[5px] h-[5px] rounded-full bg-slate-50 dark:bg-zinc-950 flex-shrink-0" />
                ))}
              </div>

              <div className="h-full flex flex-col justify-between p-6 pr-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                      <Bus className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <span className="font-bold text-base text-slate-900 dark:text-white block leading-tight">TransitIQ</span>
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-zinc-400">Boarding Pass</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-slate-500 dark:text-zinc-400 font-medium block">PNR</span>
                    <span className="font-mono text-sm font-bold tracking-wider text-slate-700 dark:text-zinc-300">{d.pnrCode}</span>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-4">
                  <div className="w-[22%]">
                    <div className="flex items-center gap-1 mb-0.5">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400 font-medium">Kalkış</span>
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{d.trip.origin.city}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">{d.trip.origin.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-1 px-4">
                    <div className="flex-1 h-px bg-slate-300 dark:bg-zinc-700" />
                    <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <Bus className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div className="flex-1 h-px bg-slate-300 dark:bg-zinc-700" />
                  </div>
                  <div className="w-[22%] text-right">
                    <div className="flex items-center gap-1 mb-0.5 justify-end">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400 font-medium">Varış</span>
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{d.trip.destination.city}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">{d.trip.destination.name}</p>
                  </div>
                </div>

                {/* Alt bilgiler: Tarih, Saat, Yolcu, Koltuk, Toplam */}
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-zinc-800/60">
                    <div className="flex items-center gap-1 mb-0.5">
                      <CalendarDays className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-medium">Tarih</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{fDate(d.trip.departureTime)}</p>
                  </div>
                  <div className="flex-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-zinc-800/60">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-medium">Saat</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{fTime(d.trip.departureTime)}</p>
                  </div>
                  <div className="flex-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-zinc-800/60">
                    <div className="flex items-center gap-1 mb-0.5">
                      <User className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-medium">Yolcu</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{d.passenger.name}</p>
                  </div>
                  <div className="w-20 rounded-lg px-3 py-2 bg-slate-50 dark:bg-zinc-800/60">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Armchair className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-medium">Koltuk</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{d.seat.number}</p>
                  </div>
                  <div className="flex-1 rounded-lg px-3 py-2 bg-slate-50 dark:bg-zinc-800/60">
                    <div className="flex items-center gap-1 mb-0.5">
                      <CreditCard className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-medium">Toplam</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Number(d.pricePaid).toFixed(0)} TL</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── SAĞ KÜÇÜK PARÇA (kopar, sağa kayar) ── */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: isTorn ? 150 : 0 }}
            transition={sp}
            className="absolute top-0 right-0 z-20"
            style={{ width: 160, height: "100%" }}
          >
            <div className="h-full bg-white dark:bg-zinc-900 rounded-r-2xl border border-l-0 border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
              {/* Sol kenar perforation */}
              <div className="absolute top-3 left-0 bottom-3 w-[4px] z-10 flex flex-col justify-between">
                {Array.from({ length: 22 }).map((_, i) => (
                  <div key={i} className="w-[5px] h-[5px] rounded-full bg-slate-50 dark:bg-zinc-950 flex-shrink-0" />
                ))}
              </div>

              {/* Kopmadan önceki kupon içeriği */}
              <div className="h-full flex flex-col items-center justify-center pl-5 pr-5 gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold">Bilet Kuponu</p>
                  <p className="font-mono text-sm font-bold text-slate-700 dark:text-zinc-300 mt-1">{d.pnrCode}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-emerald-500 text-[11px] font-semibold">Aktif</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ════════════════════════════════════
            ACTION BUTTONS
            ════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: isTorn ? 1 : 0, y: isTorn ? 0 : 16 }}
          transition={{ delay: 0.3, ...sp }}
          className="flex items-center justify-center gap-3 mt-6"
        >
          <button className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors cursor-pointer active:scale-[0.98] text-sm">
            <Download className="w-4 h-4" />
            Bileti PDF Olarak İndir
          </button>
          <button className="flex items-center gap-2.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold px-6 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-sm transition-colors cursor-pointer active:scale-[0.98] text-sm">
            <Printer className="w-4 h-4" />
            Bileti Yazdır
          </button>
        </motion.div>

        {/* ════════════════════════════════════
            BOTTOM WIDGETS (Trust / Weather / App)
            ════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: isTorn ? 1 : 0, y: isTorn ? 0 : 16 }}
          transition={{ delay: 0.45, ...sp }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* 1. Güvenli İşlem Kartı */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Bilet İşlemi Başarılı
            </h3>
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2.5">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>Biletiniz rezerve edildi.</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>256-bit SSL Ödeme</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Headphones className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span>7/24 Müşteri Hizmetleri</span>
              </div>
            </div>
          </div>

          {/* 2. Hava Durumu Kartı */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-all relative group overflow-hidden flex flex-col justify-between">
            <div className={`absolute -left-6 -top-6 w-24 h-24 ${weather?.isDay ? 'bg-amber-500/10' : 'bg-indigo-500/10'} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800/80">
                  {getWeatherIcon()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-0.5">{d.trip.destination.city}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium tracking-wide">Varış Noktası Hava</p>
                </div>
              </div>
              
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">
                  {weather ? `${weather.temp}°` : <Loader2 className="w-6 h-6 animate-spin text-slate-400" />}
                </span>
                {weather && <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">{weather.desc}</span>}
              </div>
            </div>
            
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 leading-relaxed relative z-10 mt-2">
              {weather ? (weather.temp > 20 ? "Sıcak bir hava sizi bekliyor. İnce giyinmenizi tavsiye ederiz." : weather.temp < 10 ? "Hava soğuk, kalın giyinmeyi unutmayın. 🧥" : "Harika bir hava sizi bekliyor. İyi yolculuklar! ✨") : "Hava durumu bilgisi alınıyor..."}
            </p>
          </div>

          {/* 3. Mobil Uygulama Kartı */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-800 dark:to-emerald-950 rounded-2xl p-5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl group-hover:bg-emerald-400/30 transition-colors" />
            <div className="absolute right-0 top-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
            
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
                   <Smartphone className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h3 className="text-sm font-bold text-white leading-tight mb-0.5">Mobil Uygulama</h3>
                   <p className="text-[10px] text-emerald-100 font-medium tracking-wide">TransitIQ Cebinizde</p>
                 </div>
               </div>
               <p className="text-[11px] text-emerald-50 mb-3 leading-relaxed opacity-90">
                 Biletlerinizi yönetmek ve otobüsünüzü canlı takip etmek için uygulamamızı indirin.
               </p>
            </div>
            
            <div className="flex items-center justify-between bg-black/20 backdrop-blur-md rounded-xl p-2.5 border border-white/10 relative z-10 mt-auto">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0 p-1">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-50 leading-tight">Kameraya<br/>Okutun</span>
              </div>
              <button className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                İndir <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-6 text-center text-sm text-slate-500 dark:text-zinc-500 border-t border-slate-200 dark:border-zinc-800 mt-12">
        © 2026 TransitIQ. Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
