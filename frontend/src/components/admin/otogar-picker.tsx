"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

interface Otogar {
  id: string;
  name: string;
  city: string;
  district?: string;
  lat: number;
  lng: number;
  operator?: string;
}

interface Props {
  onSelect: (o: Otogar) => void;
}

/**
 * Searches OpenStreetMap for real bus stations in a Turkish city.
 * Admin can then one-click populate station name + coordinates.
 */
export function OtogarPicker({ onSelect }: Props) {
  const [city, setCity] = useState('');
  const [results, setResults] = useState<Otogar[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!city.trim()) return;
    setLoading(true);
    try {
      const res = await api.get('/stations/lookup/otogar', { params: { city } });
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
          OpenStreetMap'ten otogar ara
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
          placeholder="Şehir adı (örn. Bursa)"
          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-500/30 text-sm font-semibold outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={search}
          disabled={!city.trim() || loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Ara
        </button>
      </div>

      <AnimatePresence>
        {results !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 max-h-56 overflow-y-auto space-y-1.5">
              {results.length === 0 ? (
                <p className="py-6 text-center text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  "{city}" için OSM'de otogar bulunamadı. Bilgileri elle doldurabilirsin.
                </p>
              ) : (
                results.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onSelect(o)}
                    className="w-full flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-zinc-800 rounded-lg text-left transition-colors group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{o.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                        {o.city}{o.district ? ` · ${o.district}` : ''}
                        {o.operator ? ` · ${o.operator}` : ''}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 dark:text-zinc-600 mt-0.5">
                        {o.lat.toFixed(4)}, {o.lng.toFixed(4)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0 mt-0.5" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
