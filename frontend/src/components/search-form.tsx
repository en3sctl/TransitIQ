'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/stations`);
        const data = await res.json();
        setStations(data);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
        // Fallback mock data for visual presentation if fetch fails
        setStations([
          { id: '1', name: 'İstanbul' },
          { id: '2', name: 'Ankara' },
          { id: '3', name: 'İzmir' },
        ]);
      }
    };
    fetchStations();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    router.push(`/search?origin=${origin}&destination=${destination}&date=${date}`);
  };

  return (
    <div className="mt-20 p-2 rounded-[28px] bg-neutral-900/40 border border-neutral-800/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-1000 delay-500 max-w-5xl mx-auto shadow-2xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/50 group hover:border-indigo-500/30 transition-colors relative">
          <label className="flex items-center gap-3 text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-indigo-500" />
            Nereden
          </label>
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto text-sm font-semibold text-neutral-200 focus:ring-0">
              <SelectValue placeholder="İstasyon Seçin" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              {stations.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-neutral-200 hover:bg-neutral-800">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/50 group hover:border-indigo-500/30 transition-colors relative">
          <label className="flex items-center gap-3 text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-purple-500" />
            Nereye
          </label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto text-sm font-semibold text-neutral-200 focus:ring-0">
              <SelectValue placeholder="İstasyon Seçin" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              {stations.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-neutral-200 hover:bg-neutral-800">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/50 group hover:border-indigo-500/30 transition-colors relative">
          <label className="flex items-center gap-3 text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-pink-500" />
            Tarih
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent border-0 p-0 h-auto text-sm font-semibold text-neutral-200 focus:ring-0 outline-none [color-scheme:dark]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!origin || !destination || !date}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-2xl flex items-center justify-center transition-all cursor-pointer select-none ring-1 ring-indigo-400/50 shadow-lg shadow-indigo-600/30 group font-bold text-white tracking-wide"
        >
          Seferleri Bul <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
}
