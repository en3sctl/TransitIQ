"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Ticket, Bus, MapPin, Route as RouteIcon, Users, CalendarDays, Percent, ShieldAlert, BellRing, Building2, UserCircle, CornerDownLeft, Keyboard } from "lucide-react";
import api from "@/lib/api";

interface SearchItem {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  tab: string;
  meta?: Record<string, any>;
}
interface SearchGroup {
  type: string;
  label: string;
  items: SearchItem[];
  total: number;
}

const TYPE_ICON: Record<string, any> = {
  booking: Ticket,
  vehicle: Bus,
  driver: Users,
  route: RouteIcon,
  station: MapPin,
  trip: CalendarDays,
  promo: Percent,
  complaint: ShieldAlert,
  'waiting-list': BellRing,
  user: UserCircle,
  tenant: Building2,
};
const TYPE_TONE: Record<string, string> = {
  booking: 'indigo',
  vehicle: 'amber',
  driver: 'sky',
  route: 'purple',
  station: 'emerald',
  trip: 'indigo',
  promo: 'amber',
  complaint: 'rose',
  'waiting-list': 'amber',
  user: 'slate',
  tenant: 'indigo',
};
const TONE_CLASS: Record<string, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string, meta?: Record<string, any>) => void;
}

export function GlobalSearch({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery('');
      setGroups([]);
      setHighlightIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    let aborted = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/search', { params: { q: query.trim() } });
        if (!aborted) {
          setGroups(res.data || []);
          setHighlightIdx(0);
        }
      } catch {
        if (!aborted) setGroups([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    }, 250);
    return () => {
      aborted = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[highlightIdx];
        if (item) {
          onNavigate(item.tab, item.meta);
          onClose();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, flatItems, highlightIdx, onClose, onNavigate]);

  if (!open) return null;

  const totalResults = flatItems.length;
  let runningIdx = 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(640px, calc(100vh - 20vh))' }}
        >
          {/* Input row */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="PNR, plaka, şehir, sürücü, promo, şikayet, telefon..."
              className="flex-1 bg-transparent outline-none text-base font-semibold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400"
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            {query && !loading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                aria-label="Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 text-[10px] font-bold text-slate-400">ESC</kbd>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!query || query.trim().length < 2 ? (
              <div className="px-5 py-10 text-center">
                <Keyboard className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">En az 2 karakter yaz</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  PNR · Plaka · Şehir · E-posta · Telefon · Promo kodu · Şikayet · Firma — hepsi buradan
                </p>
                <div className="mt-5 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400">
                  <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">↑↓</kbd> gezin</span>
                  <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 inline-flex items-center gap-0.5"><CornerDownLeft className="w-2.5 h-2.5" /></kbd> seç</span>
                  <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">ESC</kbd> kapat</span>
                </div>
              </div>
            ) : loading && totalResults === 0 ? (
              <div className="px-5 py-10 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
              </div>
            ) : totalResults === 0 ? (
              <div className="px-5 py-10 text-center">
                <Search className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
                  "{query}" için sonuç bulunamadı
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Farklı bir terim dene veya kısaltma kullan.
                </p>
              </div>
            ) : (
              <div className="py-2">
                {groups.map((g) => {
                  const Icon = TYPE_ICON[g.type] || Search;
                  const tone = TYPE_TONE[g.type] || 'slate';
                  return (
                    <div key={g.type} className="mb-1">
                      <div className="px-5 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        <Icon className="w-3 h-3" />
                        <span>{g.label}</span>
                        <span className="text-slate-300 dark:text-zinc-600">· {g.items.length}{g.total > g.items.length ? ` / ${g.total}` : ''}</span>
                      </div>
                      {g.items.map((item) => {
                        const idx = runningIdx++;
                        const isHighlighted = idx === highlightIdx;
                        return (
                          <button
                            key={`${g.type}-${item.id}`}
                            onClick={() => { onNavigate(item.tab, item.meta); onClose(); }}
                            onMouseEnter={() => setHighlightIdx(idx)}
                            className={`w-full flex items-start gap-3 px-5 py-2.5 text-left transition-colors ${
                              isHighlighted
                                ? 'bg-indigo-50 dark:bg-indigo-500/10'
                                : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TONE_CLASS[tone]}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${isHighlighted ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                                {item.subtitle}
                              </p>
                            </div>
                            {isHighlighted && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0 self-center" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {totalResults > 0 && (
            <div className="px-5 py-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-bold text-slate-400 shrink-0">
              <span>{totalResults} sonuç</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-zinc-700">↑↓</kbd> gezin</span>
                <span className="inline-flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-zinc-700"><CornerDownLeft className="w-2 h-2" /></kbd> aç</span>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
