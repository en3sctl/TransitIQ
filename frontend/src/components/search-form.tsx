'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar } from 'lucide-react';
import { StationCombobox, type Station } from '@/components/station-combobox';

export default function SearchForm() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/stations`);
        const data = await res.json();
        const stationsArray = Array.isArray(data) ? data : data.data || [];
        setStations(stationsArray);
      } catch (error) {
        console.error('Fetch error:', error);
        setStations([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStations();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert('Lütfen kalkış ve varış noktalarını seçin.');
      return;
    }
    if (origin === destination) {
      alert('Kalkış ve varış aynı olamaz.');
      return;
    }
    if (!date) {
      alert('Lütfen gidiş tarihi seçin.');
      return;
    }
    const originStation = stations.find((s) => s.id === origin);
    const destStation = stations.find((s) => s.id === destination);
    const originName = encodeURIComponent(originStation?.city || originStation?.name || '');
    const destName = encodeURIComponent(destStation?.city || destStation?.name || '');
    router.push(`/search?originId=${origin}&destinationId=${destination}&date=${date}&from=${originName}&to=${destName}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-3xl md:rounded-full shadow-2xl p-2 w-full max-w-5xl mx-auto"
    >
      {/* Origin */}
      <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 md:border-r border-slate-200 min-w-0">
        <div className="p-3 rounded-full bg-slate-50 text-slate-500 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col items-start text-left min-w-0">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Nereden</label>
          <StationCombobox
            stations={stations}
            value={origin}
            onChange={setOrigin}
            loading={isLoading}
            recentKey="transitiq.recent.origin"
            excludeId={destination}
          />
        </div>
      </div>

      {/* Destination */}
      <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 md:border-r border-slate-200 min-w-0">
        <div className="p-3 rounded-full bg-slate-50 text-slate-500 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col items-start text-left min-w-0">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Nereye</label>
          <StationCombobox
            stations={stations}
            value={destination}
            onChange={setDestination}
            loading={isLoading}
            recentKey="transitiq.recent.destination"
            excludeId={origin}
          />
        </div>
      </div>

      {/* Date */}
      <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 min-w-0">
        <div className="p-3 rounded-full bg-slate-50 text-slate-500 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col items-start text-left min-w-0">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Tarih</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent border-0 p-0 h-auto text-sm font-semibold text-slate-900 focus:ring-0 outline-none [color-scheme:light] cursor-pointer"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-1 w-full md:w-auto">
        <button
          type="submit"
          className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-full px-8 py-3 md:py-4 font-bold whitespace-nowrap transition-all cursor-pointer w-full md:w-auto shadow-sm"
        >
          <span>Bilet Bul</span>
        </button>
      </div>
    </form>
  );
}
