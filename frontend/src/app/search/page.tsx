'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus, Calendar, Clock, Lock, CheckCircle2, ShieldCheck, LifeBuoy, RefreshCcw, Users, Star } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';
import { useBookingStore } from '@/store/useBookingStore';
import { generateSeatLayout, type SeatStatus } from '@/lib/seat-engine';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CarbonFootprint } from '@/components/carbon-footprint';
import { PriceHistoryChart } from '@/components/price-history-chart';
import { useSeatRoom } from '@/hooks/use-seat-room';
import { MultiLegResults } from '@/components/search/multi-leg-results';
import { findAdjacentSeats } from '@/lib/seat-grouping';
import { DateRibbon } from '@/components/search/date-ribbon';
import { TripReviews } from '@/components/search/trip-reviews';
import { WaitingListModal } from '@/components/search/waiting-list-modal';
import { BellRing } from 'lucide-react';

const MAX_SEATS = 5;

interface Trip {
  id: string;
  departureTime: string;
  estimatedArrival: string | null;
  busType: string;
  busModel: string;
  price: number;
  availableSeats: number;
  origin: string;
  destination: string;
  originStation: string;
  destinationStation: string;
  layoutType: string;
  totalSeats: number;
  distanceKm?: number | null;
  driverRating?: number | null;
  driverReviewCount?: number;
  stops: { name: string; city: string; offsetMinutes: number }[];
}

interface SeatFromApi {
  id: string;
  seatNumber: number;
  type: string;
  status: 'AVAILABLE' | 'SOLD' | 'LOCKED' | 'BLOCKED';
}

function SearchResultsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromCity = searchParams.get('from') || '';
  const toCity = searchParams.get('to') || '';
  // Fallback: if no date specified, default to today (yesterday's cheap-trip links etc.)
  const rawDate = searchParams.get('date');
  const dateStr = rawDate && rawDate.trim() ? rawDate : new Date().toISOString().split('T')[0];
  const isFlexDate = searchParams.get('flex') === '1';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [apiSeats, setApiSeats] = useState<SeatFromApi[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState<boolean>(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [waitingListTrip, setWaitingListTrip] = useState<Trip | null>(null);

  // Zustand store
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const addSeat = useBookingStore((s) => s.addSeat);
  const removeSeat = useBookingStore((s) => s.removeSeat);
  const clearSeats = useBookingStore((s) => s.clearSeats);
  const setTrip = useBookingStore((s) => s.setTrip);
  const setSeatIdMap = useBookingStore((s) => s.setSeatIdMap);
  const seatIdMap = useBookingStore((s) => s.seatIdMap);
  const totalPrice = useBookingStore((s) => s.totalPrice);
  const [isLocking, setIsLocking] = useState(false);

  // ─── Fetch trips from backend ───
  useEffect(() => {
    const fetchTrips = async () => {
      if (!fromCity || !toCity) {
        setSearchError('Kalkış veya varış şehri belirtilmemiş. Ana sayfadan arama yap.');
        setIsLoadingTrips(false);
        return;
      }

      try {
        setIsLoadingTrips(true);
        setSearchError(null);
        const res = await api.get('/booking/search', {
          params: {
            startLocation: decodeURIComponent(fromCity),
            endLocation: decodeURIComponent(toCity),
            date: dateStr,
          },
        });
        setTrips(res.data);
      } catch {
        setSearchError('Seferler yüklenirken bir hata oluştu');
        setTrips([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };

    fetchTrips();
  }, [fromCity, toCity, dateStr]);

  // ─── Fetch seats when trip selected ───
  const fetchSeatsForTrip = useCallback(async (tripId: string) => {
    try {
      const res = await api.get(`/booking/trips/${tripId}/seats`);
      const data = res.data;
      setApiSeats(data.seats);

      // Build seatNumber → seatId mapping for checkout
      const idMap: Record<number, string> = {};
      data.seats.forEach((s: SeatFromApi) => {
        idMap[s.seatNumber] = s.id;
      });
      setSeatIdMap(idMap);
    } catch {
      setApiSeats([]);
    }
  }, [setSeatIdMap]);

  // ─── Refresh seats when tab regains focus ───
  useEffect(() => {
    const handleFocus = () => {
      if (selectedTrip) {
        fetchSeatsForTrip(selectedTrip.id);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedTrip, fetchSeatsForTrip]);

  // ─── Real-time seat room (WebSocket) ───
  const { viewers, focusedSeats, focus: broadcastFocus } = useSeatRoom({
    tripId: selectedTrip?.id || null,
    onSeatsChanged: () => {
      // Another user changed seat state — refetch to stay in sync
      if (selectedTrip) fetchSeatsForTrip(selectedTrip.id);
    },
  });

  // Convert API seats to engine-compatible status map
  const seatStatusMap = useMemo(() => {
    const map = new Map<number, SeatStatus>();
    apiSeats.forEach((s) => {
      if (s.status === 'SOLD') map.set(s.seatNumber, 'sold');
      else if (s.status === 'LOCKED') map.set(s.seatNumber, 'locked');
      else if (s.status === 'BLOCKED') map.set(s.seatNumber, 'sold');
    });
    return map;
  }, [apiSeats]);

  const isTripFull = useMemo(() => {
    // Primary source: live seat map (picks up mid-session locks too).
    if (apiSeats.length > 0) {
      return apiSeats.every((s) => s.status !== 'AVAILABLE');
    }
    // Fallback while apiSeats is still loading — trust the trip's own count.
    if (selectedTrip) return selectedTrip.availableSeats === 0;
    return false;
  }, [apiSeats, selectedTrip]);

  // Generate seat layout from engine
  const seatLayout = useMemo(() => {
    if (!selectedTrip) return null;
    return generateSeatLayout(selectedTrip.layoutType, selectedTrip.totalSeats, seatStatusMap);
  }, [selectedTrip, seatStatusMap]);

  // ─── Format time helper ───
  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (departure: string, arrival: string | null) => {
    if (!arrival) return '';
    const dep = new Date(departure).getTime();
    const arr = new Date(arrival).getTime();
    const diff = arr - dep;
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}s ${mins}dk`;
  };

  const handleSelectTrip = (trip: Trip) => {
    setIsLoadingSeats(true);
    clearSeats();

    // Write to Zustand store
    setTrip({
      tripId: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      originStation: trip.originStation,
      destinationStation: trip.destinationStation,
      date: dateStr || '',
      departureTime: trip.departureTime,
      arrivalTime: trip.estimatedArrival || trip.departureTime,
      busType: trip.busType,
      busModel: trip.busModel,
      layoutType: trip.layoutType,
      totalSeats: trip.totalSeats,
      basePrice: trip.price,
      distanceKm: trip.distanceKm,
    });

    // Fetch real seat data
    fetchSeatsForTrip(trip.id).then(() => {
      setSelectedTrip(trip);
      setIsLoadingSeats(false);
    });
  };

  const handleToggleSeat = (seatNumber: number) => {
    const seatStatus = seatStatusMap.get(seatNumber);
    if (seatStatus === 'sold' || seatStatus === 'locked') return;

    if (selectedSeats.includes(seatNumber)) {
      removeSeat(seatNumber);
    } else if (selectedSeats.length < MAX_SEATS) {
      addSeat(seatNumber);
    }
  };

  // Seat button style logic
  const getSeatStyle = (seatNumber: number) => {
    const isSelected = selectedSeats.includes(seatNumber);
    const status = seatStatusMap.get(seatNumber);

    if (isSelected) {
      return 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-400/50';
    }
    if (status === 'sold') {
      return 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-400 dark:text-red-600 cursor-not-allowed opacity-90';
    }
    if (status === 'locked') {
      return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-400 dark:text-amber-600 cursor-not-allowed opacity-90';
    }
    return 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-zinc-300 cursor-pointer';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">

      {/* Redirect to Checkout Preloader */}
      {isRedirectingToCheckout && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ width: '150px', height: '150px' }} />
              <Lock className="w-20 h-20 text-emerald-600 dark:text-emerald-400 animate-bounce relative z-10" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-2 animate-pulse">Güvenli ödeme sayfasına yönlendiriliyorsunuz...</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">Lütfen bekleyiniz, bağlantınız şifreleniyor.</p>
          </div>
        </div>
      )}

      {/* Seat Loading Preloader */}
      {isLoadingSeats && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ width: '150px', height: '150px' }} />
              <Bus className="w-20 h-20 text-indigo-600 dark:text-indigo-400 animate-bounce relative z-10" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-2 animate-pulse">Koltuk haritası hazırlanıyor...</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">En uygun koltuklar sizin için listeleniyor.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {selectedTrip ? (
            <button
              onClick={() => { setSelectedTrip(null); clearSeats(); }}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Sefer Seçimine Dön</span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Ana Sayfaya Dön</span>
            </button>
          )}

          <div className="flex flex-col items-center text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Gidiş Seferleri</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" strokeWidth={2.5} />
              {dateStr ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
          <div>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="max-w-7xl mx-auto px-4 pt-6 flex items-center justify-center gap-4 text-xs font-bold text-slate-400 dark:text-zinc-500">
        <div className={`flex items-center gap-1.5 ${!selectedTrip ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-semibold ${!selectedTrip ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'}`}>1</span>
          <span>Sefer Seçimi</span>
        </div>
        <div className={`w-8 h-px ${selectedTrip ? 'bg-emerald-300 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-zinc-800'}`} />
        <div className={`flex items-center gap-1.5 ${selectedTrip && selectedSeats.length === 0 ? 'text-indigo-600 dark:text-indigo-400' : selectedSeats.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-semibold ${selectedTrip && selectedSeats.length === 0 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : selectedSeats.length > 0 ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'}`}>2</span>
          <span>Koltuk Seçimi</span>
        </div>
        <div className={`w-8 h-px ${selectedSeats.length > 0 ? 'bg-emerald-300 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-zinc-800'}`} />
        <div className={`flex items-center gap-1.5 ${selectedSeats.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-semibold ${selectedSeats.length > 0 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'}`}>3</span>
          <span>Ödeme</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Column 1: Trips List OR Selected Summary */}
        <div className={`space-y-4 ${selectedTrip ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {!selectedTrip && (
            <DateRibbon
              from={decodeURIComponent(fromCity)}
              to={decodeURIComponent(toCity)}
              selectedDate={dateStr}
              onSelectDate={(next) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('date', next);
                router.push(`/search?${params.toString()}`);
              }}
            />
          )}
          {!selectedTrip ? (
            <>
              {isLoadingTrips ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Seferler aranıyor...</p>
                </div>
              ) : searchError ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <p className="text-sm font-bold text-red-500">{searchError}</p>
                  <Button variant="outline" onClick={() => router.push('/')}>Yeni Arama Yap</Button>
                </div>
              ) : trips.length === 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Bus className="w-12 h-12 text-slate-300 dark:text-zinc-600" />
                    <p className="text-base font-bold text-slate-500 dark:text-zinc-400">Bu tarih için direkt sefer bulunamadı</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      {isFlexDate ? 'Yukarıdaki şeritten başka bir günü dene veya aktarmalıyı kontrol ediyoruz' : 'Aşağıda aktarmalı seçenekleri kontrol ediyoruz'}
                    </p>
                  </div>
                  <MultiLegResults
                    from={decodeURIComponent(fromCity)}
                    to={decodeURIComponent(toCity)}
                    date={dateStr || ''}
                    onSelectTrip={(tripId) => {
                      router.push(`/search?from=${fromCity}&to=${toCity}&date=${dateStr}&tripId=${tripId}`);
                    }}
                  />
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => router.push('/')}>Yeni Arama Yap</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-zinc-400 flex-wrap gap-2">
                    <span>Mevcut Seferler ({trips.length})</span>
                    {isFlexDate && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                        Esnek tarih · Şeritten gün seç
                      </span>
                    )}
                  </div>

                  {/* Price history + carbon for this route (once, above trips) */}
                  {trips[0]?.origin && trips[0]?.destination && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <PriceHistoryChart from={trips[0].origin} to={trips[0].destination} days={30} />
                      {trips[0]?.distanceKm ? (
                        <CarbonFootprint distanceKm={trips[0].distanceKm} />
                      ) : null}
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {trips.map((trip) => (
                      <div key={trip.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col xl:flex-row items-center w-full gap-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">

                        {/* 1. Time & Route Group */}
                        <div className="flex-1 flex items-center w-full gap-4">
                          <div className="w-24 flex-shrink-0 text-center md:text-left">
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatTime(trip.departureTime)}</span>
                            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-0.5 truncate">{trip.origin}</p>
                          </div>

                          <div className="flex-1 flex flex-col items-center gap-1 w-full">
                            <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold">{formatDuration(trip.departureTime, trip.estimatedArrival)}</span>
                            <div className="w-full h-0.5 border-b-2 border-dashed border-slate-300 dark:border-zinc-700 relative flex items-center justify-center">
                              <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-0.5" />
                            </div>
                          </div>

                          <div className="w-24 flex-shrink-0 text-center md:text-left">
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{trip.estimatedArrival ? formatTime(trip.estimatedArrival) : '--:--'}</span>
                            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-0.5 truncate">{trip.destination}</p>
                          </div>
                        </div>

                        {/* 2. Bus Info Box */}
                        <div className="w-56 flex-shrink-0 flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/40 px-4 py-3 rounded-xl justify-start overflow-hidden">
                          <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div className="truncate flex-1">
                            <div className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full mb-0.5 inline-block">{trip.busType}</div>
                            <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 truncate">{trip.busModel}</p>
                            {trip.driverRating != null && trip.driverRating > 0 && (trip.driverReviewCount ?? 0) >= 3 && (
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>{trip.driverRating.toFixed(1)}</span>
                                <span className="text-slate-400 dark:text-zinc-500 font-semibold">({trip.driverReviewCount})</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3. Price & Action */}
                        <div className="w-52 flex-shrink-0 flex items-center justify-end gap-4 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-zinc-800 pt-4 xl:pt-0 xl:pl-4 h-full">
                          <div className="flex flex-col items-end gap-1">
                            {trip.availableSeats === 0 ? (
                              <span className="bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Dolu</span>
                            ) : (
                              <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Son {trip.availableSeats} Koltuk</span>
                            )}
                            <span className={`text-2xl font-black ${trip.availableSeats === 0 ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-900 dark:text-white'}`}>₺{trip.price}</span>
                          </div>
                          {trip.availableSeats === 0 ? (
                            <Button
                              onClick={() => setWaitingListTrip(trip)}
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold px-4 active:scale-95 transition-all duration-150 inline-flex items-center gap-1.5"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                              Haber Ver
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleSelectTrip(trip)}
                              size="sm"
                              className="bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold px-4 active:scale-95 transition-all duration-150"
                            >
                              Koltuk Seç
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
            {/* Selected Trip Summary Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300">
              {/* Trip Summary Header */}
              <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Seçilen Sefer</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedTrip(null); clearSeats(); }} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold h-7">Değiştir</Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{formatTime(selectedTrip.departureTime)}</span>
                    <ArrowLeft className="w-4 h-4 text-slate-400 dark:text-zinc-500 rotate-180" />
                    <span className="text-xl font-black text-slate-900 dark:text-white">{selectedTrip.estimatedArrival ? formatTime(selectedTrip.estimatedArrival) : '--:--'}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 text-center">{selectedTrip.origin} - {selectedTrip.destination}</p>
                  <div className="border-t border-dashed border-slate-100 dark:border-zinc-800 pt-2 flex justify-between items-center text-sm mt-1">
                    <span className="font-bold text-slate-600 dark:text-zinc-300 text-xs">{selectedTrip.busType}</span>
                    <span className="font-black text-slate-900 dark:text-white">₺{selectedTrip.price}</span>
                  </div>
                </div>
              </div>

              {/* Route Stops */}
              <div className="p-5 space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Güzergah ve Molalar</h4>
                <div className="space-y-5 relative pl-4 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-0 before:border-l before:border-dashed before:border-slate-300 dark:before:border-zinc-700">
                  <div className="relative flex items-center gap-2">
                    <div className="absolute -left-5 w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500 border border-white dark:border-zinc-900 shadow-sm" />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{selectedTrip.originStation || selectedTrip.origin}</span>
                  </div>
                  {selectedTrip.stops && selectedTrip.stops.map((stop, i) => (
                    <div key={i} className="relative flex items-center gap-2">
                      <div className="absolute -left-5 w-2 h-2 rounded-full bg-amber-500 border border-white dark:border-zinc-900 shadow-sm" />
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{stop.name} <span className="text-amber-600 dark:text-amber-400 font-medium">({stop.offsetMinutes} dk)</span></span>
                    </div>
                  ))}
                  <div className="relative flex items-center gap-2">
                    <div className="absolute -left-5 w-2 h-2 rounded-full bg-indigo-600 border border-white dark:border-zinc-900 shadow-sm" />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{selectedTrip.destinationStation || selectedTrip.destination}</span>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="h-96 relative w-full bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedTrip.origin)}+to+${encodeURIComponent(selectedTrip.destination)}&t=&z=6&ie=UTF8&iwloc=&output=embed`}
                  className="filter contrast-[0.9] saturate-[0.9] dark:invert"
                />
              </div>
            </div>
            <TripReviews tripId={selectedTrip.id} />
            </>
          )}
        </div>

        {/* Column 2: Dynamic Seat Map Selection */}
        {selectedTrip && seatLayout && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-md min-h-[500px] flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-400 dark:text-zinc-500">Koltuk Seçimi</h3>
              <div className="flex items-center gap-2">
                {viewers > 1 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest"
                    aria-live="polite"
                  >
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
                      <span className="relative rounded-full bg-amber-500 w-1.5 h-1.5" />
                    </span>
                    {viewers - 1} kişi daha bakıyor
                  </motion.span>
                )}
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedSeats.length}/{MAX_SEATS}</span>
              </div>
            </div>

            {/* Full-trip waiting-list CTA */}
            {isTripFull && selectedTrip && (
              <div className="mb-5 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black tracking-tight text-amber-900 dark:text-amber-200 mb-1">Bu sefer tamamen dolu</h4>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 font-medium leading-relaxed mb-3">
                      Bekleme listesine gir, koltuk boşalınca ilk 5 kişiye anında e-posta atıyoruz.
                    </p>
                    <button
                      onClick={() => setWaitingListTrip(selectedTrip)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      Haber Ver Beni
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 justify-center mb-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" /> Boş</div>
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-red-100 border border-red-200 dark:bg-red-950/40 dark:border-red-800" /> Dolu</div>
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" /> Rezerve</div>
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-indigo-600 dark:bg-indigo-500" /> Seçili</div>
            </div>

            {/* Group pairing quick-pick (shown when nothing selected) */}
            {selectedSeats.length === 0 && seatLayout && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Grupça gidiyorsan:
                </span>
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      const group = findAdjacentSeats(seatLayout, count);
                      if (group.length < count) {
                        toast.info(`${count} yan yana koltuk bulunamadı`);
                        return;
                      }
                      clearSeats();
                      group.forEach((n) => addSeat(n));
                      toast.success(`${count} yan yana koltuk seçildi`);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-400 text-[10px] font-black transition-colors"
                  >
                    <Users className="w-2.5 h-2.5" /> {count}'li grup
                  </button>
                ))}
              </div>
            )}

            {/* Multi-select badge */}
            {selectedSeats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 mb-4"
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {selectedSeats.length} koltuk seçildi
                  </span>
                </div>
                <button
                  onClick={clearSeats}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400"
                >
                  Temizle
                </button>
              </motion.div>
            )}

            {/* Dynamic Bus Seat Map */}
            <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-4 bg-slate-100/50 dark:bg-zinc-950 max-w-xs mx-auto w-full">
              {/* Driver area */}
              <div className="flex justify-end mb-4">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <Bus className="w-5 h-5 text-slate-400 dark:text-zinc-500 rotate-90" />
                </div>
              </div>

              {/* Seat rows */}
              <div className="flex flex-col gap-2">
                {seatLayout.rows.map((row) => (
                  <div
                    key={row.rowIndex}
                    className={`flex items-center justify-between ${row.isBackRow ? 'mt-2 pt-3 border-t border-dashed border-slate-200 dark:border-zinc-800' : ''}`}
                  >
                    {/* Left side seats */}
                    <div className="flex items-center gap-2">
                      {row.seats.slice(0, seatLayout.leftCols).map((seat) =>
                        seat ? (
                          <motion.button
                            key={seat.seatNumber}
                            whileTap={seat.status === 'sold' || seat.status === 'locked' ? undefined : { scale: 0.9 }}
                            disabled={seat.status === 'sold' || seat.status === 'locked'}
                            onClick={() => handleToggleSeat(seat.seatNumber)}
                            onMouseEnter={() => seat.status !== 'sold' && seat.status !== 'locked' && broadcastFocus(seat.seatNumber)}
                            onMouseLeave={() => broadcastFocus(null)}
                            className={`relative w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${getSeatStyle(seat.seatNumber)} ${focusedSeats.has(seat.seatNumber) && !selectedSeats.includes(seat.seatNumber) ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : ''}`}
                          >
                            {seat.seatNumber}
                            {focusedSeats.has(seat.seatNumber) && !selectedSeats.includes(seat.seatNumber) && seat.status !== 'sold' && seat.status !== 'locked' && (
                              <span aria-hidden="true" className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                            )}
                          </motion.button>
                        ) : null
                      )}
                    </div>

                    {/* Aisle gap */}
                    <div className="w-8" />

                    {/* Right side seats */}
                    <div className="flex items-center gap-2">
                      {row.seats.slice(seatLayout.leftCols + 1).map((seat) =>
                        seat ? (
                          <motion.button
                            key={seat.seatNumber}
                            whileTap={seat.status === 'sold' || seat.status === 'locked' ? undefined : { scale: 0.9 }}
                            disabled={seat.status === 'sold' || seat.status === 'locked'}
                            onClick={() => handleToggleSeat(seat.seatNumber)}
                            onMouseEnter={() => seat.status !== 'sold' && seat.status !== 'locked' && broadcastFocus(seat.seatNumber)}
                            onMouseLeave={() => broadcastFocus(null)}
                            className={`relative w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${getSeatStyle(seat.seatNumber)} ${focusedSeats.has(seat.seatNumber) && !selectedSeats.includes(seat.seatNumber) ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : ''}`}
                          >
                            {seat.seatNumber}
                            {focusedSeats.has(seat.seatNumber) && !selectedSeats.includes(seat.seatNumber) && seat.status !== 'sold' && seat.status !== 'locked' && (
                              <span aria-hidden="true" className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                            )}
                          </motion.button>
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Column 3: Checkout Summary OR Trust Banner */}
        {selectedTrip && (
          <div className="lg:col-span-1 space-y-4 animate-in fade-in-50 duration-300">
            {selectedSeats.length > 0 ? (
              <>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-lg space-y-5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{selectedSeats.length > 1 ? 'Koltuklar Seçildi' : 'Koltuk Seçildi'}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-zinc-400 font-semibold">Yolcu Sayısı</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedSeats.length} Yolcu</span>
                    </div>
                    <div className="flex justify-between text-sm items-start">
                      <span className="text-slate-500 dark:text-zinc-400 font-semibold">Koltuk No</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        <AnimatePresence>
                          {selectedSeats.map((seat) => (
                            <motion.span
                              key={seat}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md text-xs"
                            >
                              {seat}
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    {selectedSeats.length > 1 && (
                      <div className="flex justify-between text-sm text-slate-400 dark:text-zinc-500">
                        <span>{selectedSeats.length} x ₺{selectedTrip.price}</span>
                        <span>₺{totalPrice()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base border-t border-slate-100 dark:border-zinc-800 pt-3">
                      <span className="text-slate-800 dark:text-white font-bold">Toplam Tutar</span>
                      <span className="font-black text-xl text-slate-900 dark:text-white">₺{totalPrice()}</span>
                    </div>
                  </div>

                  <Button
                    disabled={isLocking}
                    onClick={async () => {
                      if (!selectedTrip) return;
                      setIsLocking(true);
                      try {
                        // Lock seats before going to checkout
                        const seatIds = selectedSeats.map((sn) => seatIdMap[sn]).filter(Boolean);
                        if (seatIds.length === selectedSeats.length) {
                          await api.post('/booking/seats/lock', {
                            tripId: selectedTrip.id,
                            seatIds,
                          });
                        }
                        setIsRedirectingToCheckout(true);
                        setTimeout(() => router.push('/checkout'), 1200);
                      } catch (err: any) {
                        const msg = err.response?.data?.message;
                        toast.error(typeof msg === 'string' ? msg : 'Koltuklar başka bir kullanıcı tarafından alınmış olabilir. Lütfen farklı koltuk seçin.');
                        // Refresh seat map to show updated statuses
                        fetchSeatsForTrip(selectedTrip.id);
                        clearSeats();
                      } finally {
                        setIsLocking(false);
                      }
                    }}
                    className="w-full bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl py-6 font-bold text-base shadow-md"
                  >
                    {isLocking ? 'Koltuklar rezerve ediliyor...' : 'Ödemeye İlerle'}
                  </Button>
                </div>

                {/* Secure Transaction Card */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Güvenli İşlem
                  </h3>
                  <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>256-bit SSL Güvenli Ödeme</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                      <RefreshCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Koşulsuz Kesintisiz İade</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                      <LifeBuoy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>7/24 Müşteri Hizmetleri</span>
                    </div>
                  </div>
                </div>

                {/* Branding */}
                <div className="flex flex-col items-center justify-center py-16 animate-in fade-in-50 duration-500">
                  <BrandLogo
                    width={320}
                    height={175}
                    className="h-20 w-auto mb-3 opacity-90"
                  />
                  <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 mt-2">İyi Yolculuklar Dileriz</p>
                </div>
              </>
            ) : (
              /* Trust Banner */
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  TransitIQ Güvencesi
                </h3>
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"><Lock className="w-4 h-4" /></div>
                    <span>%100 Güvenli Ödeme</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"><LifeBuoy className="w-4 h-4" /></div>
                    <span>7/24 Kesintisiz Destek</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"><RefreshCcw className="w-4 h-4" /></div>
                    <span>Kolay İptal/İade</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {waitingListTrip && (
          <WaitingListModal
            tripId={waitingListTrip.id}
            origin={waitingListTrip.origin}
            destination={waitingListTrip.destination}
            departureTime={waitingListTrip.departureTime}
            onClose={() => setWaitingListTrip(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SearchResultsPageContent />
    </Suspense>
  );
}
