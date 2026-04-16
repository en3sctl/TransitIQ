'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, X, Clock, Check } from 'lucide-react';

export interface Station {
  id: string;
  name: string;
  city: string;
}

interface Props {
  stations: Station[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  placeholder?: string;
  /** localStorage key to track recent picks. Separate for origin/dest. */
  recentKey?: string;
  excludeId?: string;
}

// TR-insensitive normalization: "İstanbul" ↔ "istanbul" ↔ "istambul" (partial)
function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replaceAll('i̇', 'i')
    .replaceAll('ı', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ç', 'c')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ğ', 'g')
    .trim();
}

function loadRecents(key?: string): string[] {
  if (!key || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(key: string, id: string) {
  if (typeof window === 'undefined') return;
  const current = loadRecents(key);
  const next = [id, ...current.filter((x) => x !== id)].slice(0, 5);
  localStorage.setItem(key, JSON.stringify(next));
}

export function StationCombobox({
  stations,
  value,
  onChange,
  loading = false,
  placeholder = 'Şehir veya istasyon ara',
  recentKey,
  excludeId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecents(loadRecents(recentKey));
  }, [recentKey, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const selected = stations.find((s) => s.id === value);

  const { popular, filtered } = useMemo(() => {
    const q = normalize(query);
    const base = stations.filter((s) => s.id !== excludeId);
    if (!q) {
      return { popular: base.slice(0, 30), filtered: [] };
    }
    const matches = base.filter(
      (s) => normalize(s.name).includes(q) || normalize(s.city).includes(q),
    );
    // Sort: startsWith city first, then rest
    matches.sort((a, b) => {
      const ac = normalize(a.city).startsWith(q) ? 0 : 1;
      const bc = normalize(b.city).startsWith(q) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return a.name.localeCompare(b.name, 'tr');
    });
    return { popular: [], filtered: matches.slice(0, 40) };
  }, [stations, query, excludeId]);

  const recentStations = useMemo(
    () =>
      recents
        .map((id) => stations.find((s) => s.id === id))
        .filter((s): s is Station => !!s && s.id !== excludeId),
    [recents, stations, excludeId],
  );

  const visible = query ? filtered : [...recentStations, ...popular.filter((p) => !recents.includes(p.id))];

  const pick = (id: string) => {
    onChange(id);
    if (recentKey) saveRecent(recentKey, id);
    setQuery('');
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, visible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = visible[highlight];
      if (item) pick(item.id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => setHighlight(0), [query, open]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-left min-w-0 bg-transparent"
      >
        <span className={`truncate text-sm font-semibold ${selected ? 'text-slate-900' : 'text-slate-500'}`}>
          {selected ? selected.name : 'İstasyon Seçin'}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={clear}
            onKeyDown={(e) => { if (e.key === 'Enter') clear(e as any); }}
            className="ml-auto shrink-0 text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
            aria-label="Temizle"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-3 md:left-auto md:right-auto md:w-[420px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col"
          onWheel={(e) => e.stopPropagation()}
          style={{ maxHeight: 'min(380px, calc(100vh - 180px))' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder={placeholder}
              className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Aramayı temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">Yükleniyor...</div>
            ) : visible.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MapPin className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  {query ? `"${query}" için eşleşme yok` : 'İstasyon bulunamadı'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Farklı bir şehir veya istasyon adı dene.</p>
              </div>
            ) : (
              <>
                {!query && recentStations.length > 0 && (
                  <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Son seçilenler</span>
                  </div>
                )}
                {visible.map((s, i) => {
                  const isRecent = !query && recentStations.some((r) => r.id === s.id);
                  const isPopularHeader = !query && i === recentStations.length && recentStations.length > 0;
                  return (
                    <div key={s.id}>
                      {isPopularHeader && (
                        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tüm istasyonlar</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => pick(s.id)}
                        onMouseEnter={() => setHighlight(i)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                          i === highlight
                            ? 'bg-indigo-50 dark:bg-indigo-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                        } ${s.id === value ? 'bg-emerald-50/60 dark:bg-emerald-500/10' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isRecent
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                          }`}
                        >
                          {isRecent ? <Clock className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">{s.city}</p>
                        </div>
                        {s.id === value && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
