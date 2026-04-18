"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Bus, Clock, MapPin, User, Play, CheckCircle2, Navigation, AlertCircle,
  Loader2, LogOut, Radio, Gauge, Pause, Users, ScanLine, Wallet,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { BrandLogo } from "@/components/brand-logo";
import { ModeToggle } from "@/components/mode-toggle";
import { ManifestModal } from "@/components/driver/manifest-modal";
import { SosModal } from "@/components/driver/sos-modal";
import { PreTripModal } from "@/components/driver/pre-trip-modal";
import { ExpenseModal } from "@/components/driver/expense-modal";
import { LostItemsModal } from "@/components/driver/lost-items-modal";
import { RoadAlerts } from "@/components/driver/road-alerts";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface DriverTrip {
  id: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  departureTime: string;
  estimatedArrival: string | null;
  driverStartedAt: string | null;
  driverCompletedAt: string | null;
  route: {
    title: string;
    originStationId: string;
    destinationStationId: string;
  };
  vehicle: {
    registrationPlate: string;
    model: string | null;
  };
}

/** ms farkını "2s 15dk" tarzı insan okunur biçimde döndürür. */
function formatDuration(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}dk`;
  return `${h}s ${m}dk`;
}

function fTime(s: string) {
  return new Date(s).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

const PUSH_INTERVAL_MS = 20000;

function DriverPage() {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'pushing' | 'error'>('idle');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; speed?: number } | null>(null);
  const [lastPushAt, setLastPushAt] = useState<Date | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const pushIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [manifestTripId, setManifestTripId] = useState<string | null>(null);
  const [sosTripId, setSosTripId] = useState<string | null>(null);
  const [preTripTripId, setPreTripTripId] = useState<string | null>(null);
  const [expenseTripId, setExpenseTripId] = useState<string | null>(null);
  const [lostItemsTripId, setLostItemsTripId] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  // When we detect an ACTIVE trip, start GPS push
  useEffect(() => {
    const active = trips.find((t) => t.status === 'ACTIVE');
    if (active) {
      setActiveTripId(active.id);
      startGpsPush(active.id);
    } else {
      setActiveTripId(null);
      stopGpsPush();
    }
    return () => stopGpsPush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  async function loadTrips() {
    setLoading(true);
    try {
      const res = await api.get('/driver-ops/trips/today');
      setTrips(res.data);
    } catch {
      toast.error('Seferler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  // Seferi başlat = pre-trip kontrol formu aç. Form kaydedilince modal
  // içeride status=ACTIVE'e çekilir, sonra loadTrips tetiklenir.
  function startTrip(tripId: string) {
    setPreTripTripId(tripId);
  }

  async function completeTrip(tripId: string) {
    const ok = await confirmDialog({
      title: 'Seferi tamamla',
      message: 'Bu sefer tamamlandı olarak işaretlenecek. GPS takibi duracak, yolcu manifesto kilitlenecek.',
      variant: 'success',
      confirmLabel: 'Tamamla',
    });
    if (!ok) return;
    try {
      await api.patch(`/driver-ops/trips/${tripId}/status`, { status: 'COMPLETED' });
      toast.success('Sefer tamamlandı');
      loadTrips();
    } catch {
      toast.error('İşlem başarısız');
    }
  }

  function startGpsPush(tripId: string) {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      toast.error('Cihazın GPS desteklemiyor');
      return;
    }
    setGpsStatus('requesting');

    // Continuous position watch (for accuracy)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? pos.coords.speed * 3.6 : undefined, // m/s → km/h
        });
        setGpsStatus('pushing');
      },
      (err) => {
        console.error('GPS error', err);
        setGpsStatus('error');
        toast.error('GPS izni reddedildi. Konum gönderilemiyor.');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    // Push interval (every 20 seconds, if we have coords)
    pushIntervalRef.current = setInterval(() => {
      const coords = currentCoordsRef.current;
      if (!coords) return;
      api.post(`/driver-ops/trips/${tripId}/location`, {
        latitude: coords.lat,
        longitude: coords.lng,
        ...(coords.speed ? { speed: coords.speed } : {}),
      })
        .then(() => setLastPushAt(new Date()))
        .catch(() => {/* silent */});
    }, PUSH_INTERVAL_MS);
  }

  // Keep latest coords in ref so the interval closure sees fresh data
  const currentCoordsRef = useRef(currentCoords);
  useEffect(() => {
    currentCoordsRef.current = currentCoords;
  }, [currentCoords]);

  function stopGpsPush() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pushIntervalRef.current) {
      clearInterval(pushIntervalRef.current);
      pushIntervalRef.current = null;
    }
    setGpsStatus('idle');
    setCurrentCoords(null);
    setLastPushAt(null);
  }

  const activeTrip = trips.find((t) => t.id === activeTripId);
  const upcomingTrips = trips.filter((t) => t.status === 'PLANNED');
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo width={180} height={100} className="h-10 w-auto" />
          <div className="flex items-center gap-3">
            <a
              href="/driver/profil"
              className="hidden sm:flex items-center gap-2 text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-2 py-1 transition-colors"
              title="Profilim"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                {user?.name?.charAt(0).toUpperCase() || 'Ş'}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{user?.name}</p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 leading-tight">Şoför · Profilim</p>
              </div>
            </a>
            <ModeToggle />
            <button onClick={logout} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
              <LogOut className="w-3.5 h-3.5" /> Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Active trip banner */}
        {activeTrip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 mb-8 text-white relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest">Aktif Sefer</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter mb-4">{activeTrip.route.title}</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Kalkış</p>
                  <p className="text-lg font-black">{fTime(activeTrip.departureTime)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Varış</p>
                  <p className="text-lg font-black">{activeTrip.estimatedArrival ? fTime(activeTrip.estimatedArrival) : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Plaka</p>
                  <p className="text-lg font-black">{activeTrip.vehicle.registrationPlate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">GPS</p>
                  <div className="flex items-center gap-1.5">
                    {gpsStatus === 'pushing' && <Radio className="w-4 h-4 animate-pulse" />}
                    {gpsStatus === 'requesting' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {gpsStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    <p className="text-lg font-black">
                      {gpsStatus === 'pushing' ? 'Aktif' : gpsStatus === 'requesting' ? 'İzin' : gpsStatus === 'error' ? 'Hata' : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {currentCoords && (
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-mono font-bold">
                        {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                      </span>
                    </div>
                    {currentCoords.speed !== undefined && currentCoords.speed !== null && (
                      <div className="flex items-center gap-2">
                        <Gauge className="w-3.5 h-3.5" />
                        {/* Geolocation API speed m/s cinsinden; km/h için 3.6 ile çarp. */}
                        <span className="font-black">{Math.round(currentCoords.speed * 3.6)} km/h</span>
                      </div>
                    )}
                    {lastPushAt && (
                      <div className="flex items-center gap-1.5 opacity-80">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Son gönderim {fTime(lastPushAt.toISOString())}</span>
                      </div>
                    )}
                    {activeTrip.driverStartedAt && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3 h-3" />
                        <span>Vardiya: {formatDuration(Date.now() - new Date(activeTrip.driverStartedAt).getTime())}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => setManifestTripId(activeTrip.id)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold text-sm hover:bg-white/25 transition-colors"
                >
                  <Users className="w-4 h-4" /> Yolcular
                </button>
                <button
                  onClick={() => setExpenseTripId(activeTrip.id)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold text-sm hover:bg-white/25 transition-colors"
                >
                  <Wallet className="w-4 h-4" /> Masraf
                </button>
                <button
                  onClick={() => setLostItemsTripId(activeTrip.id)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold text-sm hover:bg-white/25 transition-colors"
                >
                  <span className="text-lg leading-none">📦</span> Kayıp
                </button>
                <button
                  onClick={() => setSosTripId(activeTrip.id)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm shadow-xl shadow-red-500/30 transition-all"
                  aria-label="Acil durum"
                >
                  <AlertCircle className="w-5 h-5" /> SOS
                </button>
                <button
                  onClick={() => completeTrip(activeTrip.id)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-4 rounded-2xl bg-white text-emerald-700 font-black text-sm hover:scale-[1.01] active:scale-100 transition-transform shadow-xl"
                >
                  <CheckCircle2 className="w-5 h-5" /> Tamamla
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Yol durumu — aktif sefer varsa ve GPS alındıysa göster */}
        {activeTrip && currentCoords && (
          <RoadAlerts
            coords={{ lat: currentCoords.lat, lng: currentCoords.lng }}
            currentUserId={user?.id || null}
          />
        )}

        {/* Today's trips */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Seferlerim</h2>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{trips.length} sefer</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />)}
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-10 text-center">
              <Bus className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Bugün atanmış sefer yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...upcomingTrips, ...completedTrips].map((t) => (
                <div
                  key={t.id}
                  className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 ${
                    t.status === 'COMPLETED'
                      ? 'border-slate-200/60 dark:border-zinc-800 opacity-70'
                      : 'border-slate-200/80 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="shrink-0 w-14 text-center">
                      <p className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">{fTime(t.departureTime)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">kalkış</p>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-base font-black tracking-tight text-slate-900 dark:text-white mb-1">{t.route.title}</p>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1"><Bus className="w-3 h-3" /> {t.vehicle.registrationPlate}</span>
                        {t.estimatedArrival && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Varış {fTime(t.estimatedArrival)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setManifestTripId(t.id)}
                        aria-label="Yolcu manifestosu"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" /> Manifest
                      </button>
                      {t.status === 'PLANNED' && !activeTripId && (
                        <button
                          onClick={() => startTrip(t.id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
                        >
                          <Play className="w-4 h-4" /> Başlat
                        </button>
                      )}
                      {t.status === 'PLANNED' && activeTripId && activeTripId !== t.id && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                          <Pause className="w-3 h-3" /> Beklemede
                        </span>
                      )}
                      {t.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Canlı Konum Paylaşımı</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Sefer başlatıldığında GPS otomatik açılır, yolcular seni haritada takip eder.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">QR ile Check-in</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Manifestten QR tara, yolcunun bileti saniyede doğrulanır. İsimle elle de arayabilirsin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Manifest modal */}
      <ManifestModal tripId={manifestTripId} onClose={() => setManifestTripId(null)} />
      <SosModal
        tripId={sosTripId}
        onClose={() => setSosTripId(null)}
        coords={currentCoords ? { lat: currentCoords.lat, lng: currentCoords.lng } : null}
      />
      <PreTripModal
        tripId={preTripTripId}
        onClose={() => setPreTripTripId(null)}
        onCompleted={() => loadTrips()}
      />
      <ExpenseModal
        tripId={expenseTripId}
        onClose={() => setExpenseTripId(null)}
      />
      <LostItemsModal
        tripId={lostItemsTripId}
        onClose={() => setLostItemsTripId(null)}
      />
    </div>
  );
}

export default function Driver() {
  return (
    <ProtectedRoute allowedRoles={['DRIVER']} loginPath="/login">
      <DriverPage />
    </ProtectedRoute>
  );
}
