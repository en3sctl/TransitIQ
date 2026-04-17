"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, Ticket, Calendar, User, Mail, Phone, Building2 } from "lucide-react";
import api from "@/lib/api";

interface BookingResult {
  id: string;
  pnrCode: string;
  status: string;
  pricePaid: string;
  bookingTime: string;
  passengerName: string;
  contactEmail: string;
  contactPhone: string;
  refundStatus: string | null;
  tenant: { id: string; name: string; publicName: string | null; slug: string; logoUrl: string | null };
  trip: { departureTime: string; route: { originStation: { city: string }; destinationStation: { city: string } } };
  seat: { seatNumber: number };
}

function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }
function toAbs(u: string | null) { return u ? (u.startsWith('http') ? u : apiBase() + u) : null; }

export function PlatformLookupPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookingResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    let aborted = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/super-admin/bookings/lookup', { params: { q: query.trim() } });
        if (!aborted) setResults(res.data || []);
      } catch {
        if (!aborted) setResults([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    }, 300);
    return () => { aborted = true; clearTimeout(timer); };
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="PNR, yolcu adı, e-posta veya telefon ile tüm firmalar içinde ara..."
            className="flex-1 bg-transparent outline-none text-base font-semibold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400"
            autoFocus
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-2">
          Cross-tenant arama — destek ekibinin ana aracı. Tüm firmaların biletlerini görür.
        </p>
      </div>

      {query.trim().length < 2 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Search className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">En az 2 karakter yaz</p>
        </div>
      ) : results.length === 0 && !loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">"{query}" için sonuç yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((b) => {
            const logo = toAbs(b.tenant.logoUrl);
            return (
              <div key={b.id} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                {logo ? (
                  <div className="w-12 h-12 rounded-lg bg-white border overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt={b.tenant.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shrink-0">
                    {(b.tenant.publicName || b.tenant.name)[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{b.pnrCode}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      b.status === 'CONFIRMED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                      b.status === 'CANCELLED' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' :
                      'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}>{b.status}</span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {b.tenant.publicName || b.tenant.name}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-400" /> {b.passengerName}
                    <span className="text-slate-400 font-medium">·</span>
                    <Ticket className="w-3 h-3 text-slate-400" /> Koltuk {b.seat.seatNumber}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {b.trip.route.originStation.city} → {b.trip.route.destinationStation.city} · {new Date(b.trip.departureTime).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {b.contactEmail}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {b.contactPhone}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-slate-900 dark:text-white tabular-nums">₺{Number(b.pricePaid).toLocaleString('tr-TR')}</p>
                  {b.refundStatus && b.refundStatus !== null && (
                    <p className={`text-[10px] font-bold mt-0.5 ${
                      b.refundStatus === 'FAILED' ? 'text-rose-600 dark:text-rose-400' :
                      b.refundStatus === 'REFUNDED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}>{b.refundStatus}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
