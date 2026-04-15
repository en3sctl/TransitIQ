"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Bus, User, Phone, Gauge, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import { LiveTripMap } from "@/components/live-trip-map";
import api from "@/lib/api";

interface LiveData {
  pnr: string;
  trip: {
    id: string;
    status: string;
    departureTime: string;
    estimatedArrival: string | null;
    actualArrival: string | null;
    origin: { city: string; name: string; lat: number | null; lng: number | null };
    destination: { city: string; name: string; lat: number | null; lng: number | null };
    vehicle: { registrationPlate: string; model: string | null } | null;
    driverName: string | null;
  };
  location: {
    lat: number;
    lng: number;
    speed: number | null;
    at: string;
    fresh: boolean;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PLANNED: { label: 'Kalkışı Bekliyor', color: 'amber' },
  ACTIVE: { label: 'Yolda', color: 'emerald' },
  COMPLETED: { label: 'Tamamlandı', color: 'slate' },
  CANCELLED: { label: 'İptal Edildi', color: 'rose' },
};

const COLOR_CLASSES: Record<string, string> = {
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

function fTime(s: string) {
  return new Date(s).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function fDate(s: string) {
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} saniye önce`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dakika önce`;
  const hrs = Math.floor(min / 60);
  return `${hrs} saat önce`;
}

export default function LiveTrackingPage({ params }: { params: Promise<{ pnr: string }> }) {
  const { pnr } = use(params);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(emailArg: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/booking/ticket/${pnr}/live`, { params: { email: emailArg } });
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Takip bilgisi alınamadı');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh every 15 seconds when subscribed
  useEffect(() => {
    if (!submitted || !email) return;
    fetchData(email);
    const id = setInterval(() => fetchData(email), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  // ─── Auth gate screen ───
  if (!submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
        <LandingNav />
        <main className="max-w-xl mx-auto px-6 pt-24 pb-20">
          <Link href="/hesap/biletlerim" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6">
            <ArrowLeft className="w-4 h-4" /> Biletlerime Dön
          </Link>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-4">
              <MapPin className="w-3.5 h-3.5" /> Canlı Sefer Takibi
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">
              Otobüsün şu an nerede?
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6">
              <span className="font-mono font-black">{pnr}</span> numaralı biletin için email adresini doğrula, haritayı aç.
            </p>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
                Biletteki E-posta
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold focus:border-indigo-500 outline-none transition-colors mb-4"
                autoFocus
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
              >
                <MapPin className="w-4 h-4" /> Haritayı Aç
              </button>
            </form>
          </motion.div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
        <LandingNav />
        <main className="max-w-xl mx-auto px-6 pt-24 pb-20 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Takip açılamadı</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => { setSubmitted(false); setError(null); setEmail(''); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold text-sm"
          >
            Tekrar Dene
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ─── Loading first fetch ───
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const statusMeta = STATUS_LABELS[data.trip.status] || STATUS_LABELS.PLANNED;
  const origin = data.trip.origin.lat && data.trip.origin.lng ? { lat: data.trip.origin.lat, lng: data.trip.origin.lng } : null;
  const destination = data.trip.destination.lat && data.trip.destination.lng ? { lat: data.trip.destination.lat, lng: data.trip.destination.lng } : null;
  const bus = data.location ? { lat: data.location.lat, lng: data.location.lng } : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <Link href="/hesap/biletlerim" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6">
          <ArrowLeft className="w-4 h-4" /> Biletlerime Dön
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">
              <span className="font-mono">{data.pnr}</span>
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
              {data.trip.origin.city} → {data.trip.destination.city}
            </h1>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              <span>{fDate(data.trip.departureTime)}</span>
              <span>·</span>
              <span>{fTime(data.trip.departureTime)}</span>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${COLOR_CLASSES[statusMeta.color]}`}>
            {data.trip.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
            {statusMeta.label}
          </div>
        </div>

        {/* Map */}
        <div className="mb-6">
          <LiveTripMap
            bus={bus}
            origin={origin}
            destination={destination}
            originLabel={data.trip.origin.name}
            destinationLabel={data.trip.destination.name}
            fresh={data.location?.fresh}
          />
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Kalkış</p>
            </div>
            <p className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">{fTime(data.trip.departureTime)}</p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">{data.trip.origin.name}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Tahmini Varış</p>
            </div>
            <p className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">
              {data.trip.estimatedArrival ? fTime(data.trip.estimatedArrival) : '—'}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">{data.trip.destination.name}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-rose-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Hız / Durum</p>
            </div>
            {data.location ? (
              <>
                <p className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">
                  {data.location.speed ? `${Math.round(data.location.speed)} km/s` : (data.location.fresh ? 'Canlı' : '—')}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                  {timeAgo(data.location.at)}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-black tracking-tighter text-slate-400">—</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">Henüz konum yok</p>
              </>
            )}
          </div>
        </div>

        {/* Vehicle + Driver info */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white mb-4">Araç & Şoför Bilgisi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.trip.vehicle && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Plaka</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{data.trip.vehicle.registrationPlate}</p>
                  {data.trip.vehicle.model && (
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{data.trip.vehicle.model}</p>
                  )}
                </div>
              </div>
            )}
            {data.trip.driverName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Şoför</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{data.trip.driverName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Auto-refresh note */}
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              {loading ? 'Güncelleniyor...' : 'Otomatik güncellenir — 15 saniyede bir'}
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
