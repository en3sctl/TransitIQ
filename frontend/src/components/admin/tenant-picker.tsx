"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Search, X, Check, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Tenant {
  id: string;
  name: string;
  publicName: string | null;
  slug: string;
  logoUrl: string | null;
  status?: string;
}

function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }
function toAbs(u: string | null) { return u ? (u.startsWith('http') ? u : apiBase() + u) : null; }

interface Props {
  value?: string | null;
  onChange: (tenantId: string | null, tenant: Tenant | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Searchable tenant selector for super-admin contexts. Fetches list
 * from /super-admin/tenants once, filters client-side.
 */
export function TenantPicker({ value, onChange, label, placeholder = 'Firma seç...', disabled = false }: Props) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api.get('/super-admin/tenants')
      .then((res) => setTenants(res.data || []))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const selected = tenants.find((t) => t.id === value) || null;

  const filtered = useMemo(() => {
    if (!query.trim()) return tenants;
    const q = query.toLocaleLowerCase('tr');
    return tenants.filter((t) =>
      (t.publicName || t.name).toLocaleLowerCase('tr').includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.id.includes(q),
    );
  }, [tenants, query]);

  const displayName = (t: Tenant) => t.publicName || t.name;

  return (
    <div ref={wrapRef} className="relative w-full">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors disabled:opacity-50"
      >
        {selected ? (
          <>
            {(() => {
              const logo = toAbs(selected.logoUrl);
              return logo ? (
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt={selected.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {displayName(selected)[0]?.toUpperCase()}
                </div>
              );
            })()}
            <span className="flex-1 text-left text-sm font-semibold text-slate-900 dark:text-white truncate">
              {displayName(selected)}
            </span>
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(null, null); }}
              className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          </>
        ) : (
          <>
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 text-left text-sm text-slate-400 font-medium">{placeholder}</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col" style={{ maxHeight: 'min(360px, calc(100vh - 200px))' }}>
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Firma ara..."
              className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400"
            />
            {query && <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                {query ? `"${query}" için eşleşme yok` : 'Firma yok'}
              </div>
            ) : (
              filtered.map((t) => {
                const logo = toAbs(t.logoUrl);
                const active = value === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { onChange(t.id, t); setOpen(false); setQuery(''); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-left ${active ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                  >
                    {logo ? (
                      <div className="w-8 h-8 rounded-lg bg-white border overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo} alt={t.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {displayName(t)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName(t)}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold font-mono truncate">/{t.slug}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
