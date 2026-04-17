"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BellRing, Loader2, CalendarDays, MapPin, Users as UsersIcon, Check, Clock, XCircle, ArrowRight, MailCheck, Armchair } from "lucide-react";
import { AccountLayout } from "@/components/hesap/account-layout";
import { toast } from "sonner";
import api from "@/lib/api";

interface Entry {
  id: string;
  status: 'WAITING' | 'NOTIFIED' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
  passengerCount: number;
  createdAt: string;
  notifiedAt: string | null;
  trip: {
    id: string;
    departureTime: string;
    status: string;
    origin: string;
    originStation: string;
    destination: string;
    destinationStation: string;
    availableSeats: number;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; tone: string; icon: any }> = {
  WAITING: { label: 'Sırada', tone: 'slate', icon: Clock },
  NOTIFIED: { label: 'Haber Gönderildi', tone: 'emerald', icon: MailCheck },
  CONVERTED: { label: 'Rezerve Edildi', tone: 'indigo', icon: Check },
  EXPIRED: { label: 'Süresi Doldu', tone: 'amber', icon: XCircle },
  CANCELLED: { label: 'İptal Edildi', tone: 'rose', icon: XCircle },
};

const TONE_CLASS: Record<string, string> = {
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

function fDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fTime(s: string) {
  return new Date(s).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function WaitingListPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/waiting-list/me');
      setEntries(res.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancelEntry = async (id: string) => {
    setCancelling(id);
    try {
      await api.delete(`/waiting-list/${id}`);
      toast.success('Bekleme kaydın iptal edildi');
      setEntries((list) => list.filter((e) => e.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İptal başarısız');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <AccountLayout
      title="Bekleme Listem"
      subtitle="Dolu seferlerde koltuk açılınca haber alacağın kayıtlar burada."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
            <BellRing className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-2">Hiç kayıt yok</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-md mx-auto mb-5">
            Dolu bir seferde "Haber Ver" butonuna bastığında burada görürsün.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold text-sm hover:bg-black dark:hover:bg-white"
          >
            Sefer Ara <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e, i) => {
            const meta = STATUS_LABELS[e.status] || STATUS_LABELS.WAITING;
            const StatusIcon = meta.icon;
            const canReserve = e.trip && e.trip.availableSeats >= e.passengerCount && e.trip.status === 'PLANNED';
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${TONE_CLASS[meta.tone]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                      <UsersIcon className="w-3 h-3" />
                      {e.passengerCount} kişi
                    </span>
                    {e.trip && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                        <Armchair className="w-3 h-3" />
                        {e.trip.availableSeats} boş
                      </span>
                    )}
                  </div>

                  {e.trip ? (
                    <div>
                      <div className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                        <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        {e.trip.origin} <ArrowRight className="w-4 h-4 text-slate-400" /> {e.trip.destination}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-1">
                        <CalendarDays className="w-3 h-3" />
                        {fDate(e.trip.departureTime)} · {fTime(e.trip.departureTime)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Kayıt: {fDate(e.createdAt)}
                        {e.notifiedAt && ` · Haber verildi: ${fDate(e.notifiedAt)}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Sefer artık mevcut değil</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap lg:flex-nowrap">
                  {canReserve && (
                    <Link
                      href={`/search?from=${encodeURIComponent(e.trip!.origin)}&to=${encodeURIComponent(e.trip!.destination)}&date=${new Date(e.trip!.departureTime).toISOString().slice(0, 10)}&tripId=${e.trip!.id}`}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Koltuk Al
                    </Link>
                  )}
                  <button
                    onClick={() => cancelEntry(e.id)}
                    disabled={cancelling === e.id}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {cancelling === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Listeden Çık
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
