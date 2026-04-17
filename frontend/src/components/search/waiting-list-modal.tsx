'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, BellRing, CheckCircle2, Loader2, Mail, User, Phone, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';

interface Props {
  tripId: string;
  origin: string;
  destination: string;
  departureTime: string;
  onClose: () => void;
}

export function WaitingListModal({ tripId, origin, destination, departureTime, onClose }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', passengerCount: 1 });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/waiting-list', {
        tripId,
        contactName: form.name.trim(),
        contactEmail: form.email.trim().toLowerCase(),
        contactPhone: form.phone.trim() || undefined,
        passengerCount: form.passengerCount,
      });
      setDone(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Kayıt başarısız';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const dep = new Date(departureTime);
  const dateStr = dep.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dep.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Bekleme Listesi</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                {origin} → {destination} · {dateStr} {timeStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-2">Kayıt başarılı!</h4>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto">
              Bu seferde koltuk açılır açılmaz sana e-posta atacağız. İlk gelen kapar, hızlı ol!
            </p>
            <button
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-bold text-sm"
            >
              Tamam
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/80 dark:border-amber-500/20 p-3">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                Bu sefer şu an dolu. Bekleme listesine girersen <strong>koltuk boşalınca ilk 5 kişiye e-posta</strong> atılır. Sıra kuralı: önce girdi, önce bildirim.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Ad Soyad
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required minLength={2} maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> E-posta (bildirim buraya gelir)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Telefon <span className="text-slate-400 normal-case tracking-normal">(ops.)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="05xx xxx xx xx"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <UsersIcon className="w-3 h-3" /> Yolcu
                </label>
                <select
                  value={form.passengerCount}
                  onChange={(e) => setForm({ ...form, passengerCount: parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} kişi</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
              {loading ? 'Kaydediliyor...' : 'Bekleme Listesine Katıl'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
