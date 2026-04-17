"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Trash2, Plus, TrendingDown, MapPin, ArrowRight, Loader2, Mail, Smartphone } from "lucide-react";
import { AccountLayout } from "@/components/hesap/account-layout";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface PriceAlert {
  id: string;
  originCity: string;
  destinationCity: string;
  maxPrice: number;
  notifyEmail: boolean;
  notifySms: boolean;
  active: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
}

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Trabzon', 'Samsun', 'Eskişehir', 'Kayseri', 'Mersin', 'Diyarbakır', 'Şanlıurfa', 'Kocaeli', 'Sakarya', 'Manisa', 'Balıkesir', 'Van'];

function capitalize(s: string) {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ originCity: '', destinationCity: '', maxPrice: '', notifyEmail: true, notifySms: false });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/price-alerts');
      setAlerts(res.data);
    } catch {
      toast.error('Alarmlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.originCity || !form.destinationCity || !form.maxPrice) {
      toast.error('Tüm alanları doldur');
      return;
    }
    setCreating(true);
    try {
      await api.post('/price-alerts', {
        originCity: form.originCity,
        destinationCity: form.destinationCity,
        maxPrice: Number(form.maxPrice),
        notifyEmail: form.notifyEmail,
        notifySms: form.notifySms,
      });
      toast.success('Alarm kuruldu. Fiyat düştüğünde seni haberdar ederiz.');
      setForm({ originCity: '', destinationCity: '', maxPrice: '', notifyEmail: true, notifySms: false });
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Alarm oluşturulamadı');
    } finally {
      setCreating(false);
    }
  }

  async function toggle(id: string) {
    try {
      await api.post(`/price-alerts/${id}/toggle`);
      load();
    } catch {
      toast.error('İşlem başarısız');
    }
  }

  async function remove(id: string) {
    const ok = await confirmDialog({
      title: 'Fiyat Alarmı Sil',
      message: 'Bu alarm kalıcı olarak silinecek. Emin misin?',
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!ok) return;
    try {
      await api.delete(`/price-alerts/${id}`);
      toast.success('Alarm silindi');
      load();
    } catch {
      toast.error('Silinemedi');
    }
  }

  return (
    <AccountLayout title="Fiyat Alarmları" subtitle="Takip ettiğin rotaların fiyatı düştüğünde seni anında bilgilendiririz.">
      {/* CTA */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">{alerts.length} aktif alarm</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">En fazla 20 alarm kurabilirsin</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Yeni Alarm
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={create}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Kalkış</label>
                  <select
                    value={form.originCity}
                    onChange={(e) => setForm({ ...form, originCity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    <option value="">Şehir seç</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Varış</label>
                  <select
                    value={form.destinationCity}
                    onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    <option value="">Şehir seç</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Maksimum Fiyat (₺)</label>
                <input
                  type="number"
                  value={form.maxPrice}
                  onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                  placeholder="Örn: 300"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 font-medium">Fiyat bu tutarın altına düştüğünde bildirim alacaksın</p>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.notifyEmail} onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })} />
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-posta
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.notifySms} onChange={(e) => setForm({ ...form, notifySms: e.target.checked })} />
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> SMS
                  </span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Alarmı Kur
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700"
                >
                  İptal
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="skeleton-shimmer h-24 rounded-2xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-base font-black text-slate-900 dark:text-white mb-1">Henüz alarm yok</p>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Uygun fiyat yakaladığında seni bilgilendiririz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 flex items-center gap-4 ${
                a.active ? 'border-slate-200/80 dark:border-zinc-800' : 'border-slate-200/80 dark:border-zinc-800 opacity-60'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                a.active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
              }`}>
                {a.active ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {capitalize(a.originCity)}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    {capitalize(a.destinationCity)}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  <strong className="text-rose-600 dark:text-rose-400">₺{a.maxPrice.toLocaleString('tr-TR')}</strong> altına düşerse
                  {a.notifyEmail && ' · E-posta'}
                  {a.notifySms && ' · SMS'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggle(a.id)}
                  aria-label={a.active ? 'Duraklat' : 'Aktifleştir'}
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                >
                  {a.active ? <Bell className="w-4 h-4 text-slate-500" /> : <BellOff className="w-4 h-4 text-slate-500" />}
                </button>
                <button
                  onClick={() => remove(a.id)}
                  aria-label="Sil"
                  className="w-9 h-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
