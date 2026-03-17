'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, MoveRight } from 'lucide-react';

interface Station {
  id: string;
  name: string;
}

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
        console.log('Fetched stations:', data);
        const stationsArray = Array.isArray(data) ? data : data.data || [];
        setStations(stationsArray);
      } catch (error) {
        console.error('Fetch error:', error);
        setStations([]); // Empty lists trigger fallback row
      } finally {
        setIsLoading(false);
      }
    };
    fetchStations();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert("Lütfen kalkış ve varış noktalarını seçin.");
      return;
    }
    if (!date) {
      alert("Lütfen gidiş tarihi seçin.");
      return;
    }
    router.push(`/search?originId=${origin}&destinationId=${destination}&date=${date}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row items-center bg-white rounded-3xl md:rounded-full shadow-2xl p-2 w-full max-w-5xl mx-auto"
    >
      {/* Origin */}
      <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 md:border-r border-slate-200 min-w-0">
        <div className="p-3 rounded-full bg-slate-50 text-slate-500 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col items-start text-left min-w-0">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Nereden</label>
          <Select value={origin} onValueChange={(val) => setOrigin(val || '')}>
            <SelectTrigger className="border-0 p-0 text-sm h-auto focus:ring-0 text-slate-900 font-semibold bg-transparent shadow-none w-full text-left justify-start truncate">
              <SelectValue placeholder="İstasyon Seçin" className="truncate text-slate-900" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl z-50">
              {isLoading ? (
                <SelectItem value="loading" disabled className="text-slate-400">Yükleniyor...</SelectItem>
              ) : stations.length === 0 ? (
                <SelectItem value="none" disabled className="text-slate-400">İstasyon bulunamadı</SelectItem>
              ) : (
                stations.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Destination */}
      <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 md:border-r border-slate-200 min-w-0">
        <div className="p-3 rounded-full bg-slate-50 text-slate-500 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col items-start text-left min-w-0">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Nereye</label>
          <Select value={destination} onValueChange={(val) => setDestination(val || '')}>
            <SelectTrigger className="border-0 p-0 text-sm h-auto focus:ring-0 text-slate-900 font-semibold bg-transparent shadow-none w-full text-left justify-start truncate">
              <SelectValue placeholder="İstasyon Seçin" className="truncate text-slate-900" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl z-50">
              {isLoading ? (
                <SelectItem value="loading" disabled className="text-slate-400">Yükleniyor...</SelectItem>
              ) : stations.length === 0 ? (
                <SelectItem value="none" disabled className="text-slate-400">İstasyon bulunamadı</SelectItem>
              ) : (
                stations.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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
