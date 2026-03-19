'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus, Calendar, Clock, Lock, CheckCircle2, ShieldCheck, LifeBuoy, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  busType: string;
  busModel: string;
  price: number;
  availableSeats: number;
  origin: string;
  destination: string;
}

interface Seat {
  id: string;
  seatNumber: string;
  status: 'AVAILABLE' | 'MALE' | 'FEMALE' | 'BLOCKED';
  type: 'STANDARD' | 'VIP';
}

function SearchResultsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const originId = searchParams.get('originId');
  const destinationId = searchParams.get('destinationId');
  const dateStr = searchParams.get('date');

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isLoadingSeats, setIsLoadingSeats] = useState<boolean>(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState<boolean>(false);

  // Mock Trip Data (usually fetched from backend)
  const mockTrips: Trip[] = [
    {
      id: "1",
      departureTime: "10:00",
      arrivalTime: "15:30",
      duration: "5s 30dk",
      busType: "2+1 VIP",
      busModel: "Mercedes-Benz Travego Premium XL",
      price: 450,
      availableSeats: 3,
      origin: "İstanbul",
      destination: "Ankara"
    },
    {
      id: "2",
      departureTime: "13:30",
      arrivalTime: "20:00",
      duration: "6s 30dk",
      busType: "2+2 Standart",
      busModel: "Setra S 516 HDX",
      price: 380,
      availableSeats: 5,
      origin: "İstanbul",
      destination: "Ankara"
    },
    {
      id: "3",
      departureTime: "22:00",
      arrivalTime: "03:30",
      duration: "5s 30dk",
      busType: "2+1 VIP",
      busModel: "MAN Lion's Coach Supreme",
      price: 480,
      availableSeats: 12,
      origin: "İstanbul",
      destination: "Ankara"
    }
  ];

  // Mock Seat Layout 2+1 (30 seats)
  const [mockSeats, setMockSeats] = useState<Seat[]>([]);

  useEffect(() => {
    if (selectedTrip) {
      const isVip = selectedTrip.busType.includes('VIP');
      const generatedSeats: Seat[] = Array.from({ length: 30 }, (_, i) => {
        const seatNum = String(i + 1);
        let status: Seat['status'] = 'AVAILABLE';
        const rand = Math.random();
        if (rand > 0.85) status = 'MALE';
        else if (rand > 0.70) status = 'FEMALE';
        else if (rand > 0.95) status = 'BLOCKED';

        return {
          id: `seat-${seatNum}`,
          seatNumber: seatNum,
          status,
          type: isVip ? 'VIP' : 'STANDARD'
        };
      });
      setMockSeats(generatedSeats);
      setSelectedSeat(null); // Reset when trip changes
    }
  }, [selectedTrip]);

  const handleSelectTrip = (trip: Trip) => {
    // 1. First trigger overlay so layout stays intact underneath
    setIsLoadingSeats(true);
    
    // 2. Save to sessionStorage for back-navigation persistence
    sessionStorage.setItem('tempSelectedTrip', JSON.stringify(trip));

    // 3. Set timeout so selection mounts exactly when preloader is fully visible
    setTimeout(() => {
      setSelectedTrip(trip);
      setIsLoadingSeats(false);
    }, 1500); // 1.5 seconds delay for smoother appearance
  };

  // Restore selectedTrip from sessionStorage on mount (for back-nav from checkout)
  useEffect(() => {
    const saved = sessionStorage.getItem('tempSelectedTrip');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Trip;
        setSelectedTrip(parsed);
      } catch { /* ignore parse errors */ }
    }
  }, []);

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

      {/* Şekilli Şukullu Full Screen Preloader */}
      {isLoadingSeats && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-4">
            
            {/* Pulsing Back Glow behind Animated Bus */}
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
              onClick={() => { setSelectedTrip(null); sessionStorage.removeItem('tempSelectedTrip'); }}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Sefer Seçimine Dön</span>
            </button>
          ) : (
            <button
              onClick={() => { sessionStorage.removeItem('tempSelectedTrip'); router.push('/'); }}
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
              {dateStr ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '23 Mart 2026'}
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
        <div className="w-8 h-px bg-slate-200 dark:bg-zinc-800" />
        <div className={`flex items-center gap-1.5 ${selectedTrip && !selectedSeat ? 'text-indigo-600 dark:text-indigo-400' : selectedSeat ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-semibold ${selectedTrip && !selectedSeat ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'}`}>2</span>
          <span>Koltuk Seçimi</span>
        </div>
        <div className="w-8 h-px bg-slate-200 dark:bg-zinc-800" />
        <div className={`flex items-center gap-1.5 ${selectedSeat ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-semibold ${selectedSeat ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'}`}>3</span>
          <span>Ödeme</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Trips List OR Selected Summary */}
        <div className={`space-y-4 ${selectedTrip ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {!selectedTrip ? (
            <>
              <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-zinc-400">
                <span>Mevcut Seferler ({mockTrips.length})</span>
              </div>
              <div className="flex flex-col gap-6">
                {mockTrips.map((trip) => (
                  <div key={trip.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col xl:flex-row items-center w-full gap-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    
                    {/* 1. Time & Route Group */}
                    <div className="flex-1 flex items-center w-full gap-4">
                      <div className="w-24 flex-shrink-0 text-center md:text-left">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{trip.departureTime}</span>
                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-0.5 truncate">{trip.origin}</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center gap-1 w-full">
                        <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold">{trip.duration}</span>
                        <div className="w-full h-0.5 border-b-2 border-dashed border-slate-300 dark:border-zinc-700 relative flex items-center justify-center">
                          <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-0.5" />
                        </div>
                      </div>

                      <div className="w-24 flex-shrink-0 text-center md:text-left">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{trip.arrivalTime}</span>
                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-0.5 truncate">{trip.destination}</p>
                      </div>
                    </div>
                    
                    {/* 2. Bus Info Box */}
                    <div className="w-56 flex-shrink-0 flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/40 px-4 py-3 rounded-xl justify-start overflow-hidden">
                      <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full mb-0.5 inline-block">{trip.busType}</div>
                        <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 truncate">{trip.busModel}</p>
                      </div>
                    </div>

                    {/* 3. Price & Action (Redesigned) */}
                    <div className="w-52 flex-shrink-0 flex items-center justify-end gap-4 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-zinc-800 pt-4 xl:pt-0 xl:pl-4 h-full">
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Son {trip.availableSeats} Koltuk</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">₺{trip.price}</span>
                      </div>
                      <Button 
                        onClick={() => handleSelectTrip(trip)} 
                        size="sm" 
                        className="bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold px-4 active:scale-95 transition-all duration-150"
                      >
                        Koltuk Seç
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Merged Single Elegant Card for Selected Trip - REORDERED */
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300">
              {/* 1. Trip Summary Header (Top) */}
              <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Seçilen Sefer</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedTrip(null); sessionStorage.removeItem('tempSelectedTrip'); }} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold h-7">Değiştir</Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{selectedTrip.departureTime}</span>
                    <ArrowLeft className="w-4 h-4 text-slate-400 dark:text-zinc-500 rotate-180" />
                    <span className="text-xl font-black text-slate-900 dark:text-white">{selectedTrip.arrivalTime}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 text-center">{selectedTrip.origin} - {selectedTrip.destination}</p>
                  <div className="border-t border-dashed border-slate-100 dark:border-zinc-800 pt-2 flex justify-between items-center text-sm mt-1">
                    <span className="font-bold text-slate-600 dark:text-zinc-300 text-xs">{selectedTrip.busType}</span>
                    <span className="font-black text-slate-900 dark:text-white">₺{selectedTrip.price}</span>
                  </div>
                </div>
              </div>

              {/* 2. Minimalist Timeline for Stops/Breaks (Middle) */}
              <div className="p-5 space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Güzergah ve Molalar</h4>
                <div className="space-y-5 relative pl-4 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-0 before:border-l before:border-dashed before:border-slate-300 dark:before:border-zinc-700">
                  <div className="relative flex items-center gap-2">
                    <div className="absolute -left-5 w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500 border border-white dark:border-zinc-900 shadow-sm" />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{selectedTrip.origin}</span>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <div className="absolute -left-5 w-2 h-2 rounded-full bg-amber-500 border border-white dark:border-zinc-900 shadow-sm" />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Bolu Dağı Tesisleri <span className="text-amber-600 dark:text-amber-400 font-medium">(30 dk mola)</span></span>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <div className="absolute -left-5 w-2 h-2 rounded-full bg-indigo-600 border border-white dark:border-zinc-900 shadow-sm" />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{selectedTrip.destination}</span>
                  </div>
                </div>
              </div>

              {/* 3. Taller Real Interactive Map Section (Bottom) */}
              <div className="h-96 relative w-full bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${selectedTrip.origin}+to+${selectedTrip.destination}&t=&z=6&ie=UTF8&iwloc=&output=embed`}
                  className="filter contrast-[0.9] saturate-[0.9] dark:invert"
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Seat Map Selection */}
        {selectedTrip && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-md min-h-[500px] flex flex-col transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-400 dark:text-zinc-500 mb-6 font-semibold">Koltuk Seçimi</h3>
            
            <div className="grid grid-cols-2 gap-2 justify-center mb-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" /> Boş</div>
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800" /> Erkek</div>
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-pink-100 border border-pink-200 dark:bg-pink-950/40 dark:border-pink-800" /> Bayan</div>
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-indigo-600 dark:bg-indigo-500" /> Seçili</div>
            </div>

            <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-4 bg-slate-100/50 dark:bg-zinc-950 max-w-xs mx-auto w-full">
              <div className="flex justify-end mb-4"><div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm"><Bus className="w-5 h-5 text-slate-400 dark:text-zinc-500 rotate-90" /></div></div>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 10 }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center justify-between">
                    {mockSeats[rowIndex * 3] && (
                      <button 
                        disabled={mockSeats[rowIndex * 3].status !== 'AVAILABLE'} 
                        onClick={() => setSelectedSeat(mockSeats[rowIndex * 3].seatNumber)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${
                          selectedSeat === mockSeats[rowIndex * 3].seatNumber ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-sm' :
                          mockSeats[rowIndex * 3].status === 'MALE' ? 'bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 cursor-not-allowed opacity-90' :
                          mockSeats[rowIndex * 3].status === 'FEMALE' ? 'bg-pink-100 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300 cursor-not-allowed opacity-90' :
                          mockSeats[rowIndex * 3].status === 'BLOCKED' ? 'bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-400 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {mockSeats[rowIndex * 3].seatNumber}
                      </button>
                    )}
                    <div className="w-8" />
                    <div className="flex items-center gap-2">
                      {[1, 2].map((offset) => {
                        const seat = mockSeats[rowIndex * 3 + offset];
                        if (!seat) return null;
                        return (
                          <button 
                            key={seat.id}
                            disabled={seat.status !== 'AVAILABLE'} 
                            onClick={() => setSelectedSeat(seat.seatNumber)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${
                              selectedSeat === seat.seatNumber ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-sm' :
                              seat.status === 'MALE' ? 'bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 cursor-not-allowed opacity-90' :
                              seat.status === 'FEMALE' ? 'bg-pink-100 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300 cursor-not-allowed opacity-90' :
                              seat.status === 'BLOCKED' ? 'bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-400 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
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
            {selectedSeat ? (
              <>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-lg space-y-5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Koltuk Seçildi</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-zinc-400 font-semibold">Kapasite</span>
                      <span className="font-bold text-slate-800 dark:text-white">1 Yolcu</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-zinc-400 font-semibold">Koltuk Numarası</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">{selectedSeat}</span>
                    </div>
                    <div className="flex justify-between text-base border-t border-slate-100 dark:border-zinc-800 pt-3">
                      <span className="text-slate-800 dark:text-white font-bold">Toplam Tutar</span>
                      <span className="font-black text-xl text-slate-900 dark:text-white">₺{selectedTrip.price}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setIsRedirectingToCheckout(true);
                      const params = new URLSearchParams({
                        tripId: selectedTrip!.id,
                        seat: selectedSeat!,
                        price: String(selectedTrip!.price),
                        origin: selectedTrip!.origin,
                        destination: selectedTrip!.destination,
                        date: dateStr || '',
                        departureTime: selectedTrip!.departureTime,
                        arrivalTime: selectedTrip!.arrivalTime,
                        busType: selectedTrip!.busType,
                      });
                      setTimeout(() => {
                        router.push(`/checkout?${params.toString()}`);
                      }, 1200);
                    }}
                    className="w-full bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl py-6 font-bold text-base shadow-md"
                  >
                    Ödemeye İlerle
                  </Button>
                </div>

                {/* Secondary Secure Transaction Card */}
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

                {/* Highly Prominent Branding Filler */}
                <div className="flex flex-col items-center justify-center py-16 animate-in fade-in-50 duration-500">
                  <Bus className="w-16 h-16 mb-4 text-slate-300 dark:text-zinc-600" />
                  <p className="text-5xl font-black text-zinc-950 dark:text-zinc-100 tracking-tight">TransitIQ</p>
                  <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 mt-2">İyi Yolculuklar Dileriz</p>
                </div>
              </>
            ) : (
              /* Trust Banner to fill space when no seat selected */
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
    </div>
  );
}

import { Suspense } from "react";

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
