"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, X, Loader2, Fuel, ReceiptText, Utensils, Car, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface Props {
  tripId: string | null;
  onClose: () => void;
}

type Category = 'FUEL' | 'TOLL' | 'FOOD' | 'PARKING' | 'OTHER';

const CATEGORIES: { key: Category; label: string; icon: any }[] = [
  { key: 'FUEL', label: 'Yakıt', icon: Fuel },
  { key: 'TOLL', label: 'Otoyol', icon: ReceiptText },
  { key: 'FOOD', label: 'Yemek', icon: Utensils },
  { key: 'PARKING', label: 'Otopark', icon: Car },
  { key: 'OTHER', label: 'Diğer', icon: MoreHorizontal },
];

interface Expense {
  id: string;
  category: Category;
  amount: string;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export function ExpenseModal({ tripId, onClose }: Props) {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('FUEL');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const res = await api.get(`/driver-ops/trips/${tripId}/expenses`);
      setItems(res.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tripId) load(); /* eslint-disable-next-line */ }, [tripId]);

  const add = async () => {
    if (!tripId) return;
    const num = Number(amount.replace(',', '.'));
    if (!num || num <= 0) { toast.error('Tutar girmelisin'); return; }
    setSubmitting(true);
    try {
      await api.post(`/driver-ops/trips/${tripId}/expenses`, {
        amount: num,
        category,
        description: description || undefined,
      });
      toast.success('Masraf eklendi');
      setAmount(''); setDescription('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Eklenemedi');
    } finally { setSubmitting(false); }
  };

  const remove = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Masraf sil',
      message: 'Bu masraf kaydı silinsin mi? Sadece PENDING kayıtlar silinebilir.',
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!ok) return;
    try {
      await api.delete(`/driver-ops/expenses/${id}`);
      toast.success('Silindi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Silinemedi');
    }
  };

  if (!tripId) return null;

  const total = items.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl max-h-[92vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="bg-emerald-600 text-white p-5 flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black tracking-tight">Yol Masrafları</h3>
              <p className="text-xs font-medium opacity-90">Bu sefere ait masrafları gir, admin onaylayınca ödenir</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/15">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* New */}
            <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Kategori</p>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 active:scale-95 transition-transform ${
                        active ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-black">{c.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Tutar (₺)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-lg font-black focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Not (ops.)</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Örn: Bolu Dağı otoyol"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={add}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm disabled:opacity-50 active:scale-95 transition-transform"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Masraf Ekle'}
              </button>
            </div>

            {/* List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Bu seferdeki kayıtlar</p>
                {items.length > 0 && (
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">Toplam: ₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                )}
              </div>
              {loading ? (
                <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></div>
              ) : items.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium text-center py-6">Henüz masraf yok</p>
              ) : (
                <div className="space-y-2">
                  {items.map((e) => {
                    const cat = CATEGORIES.find((c) => c.key === e.category);
                    const Icon = cat?.icon || MoreHorizontal;
                    return (
                      <div key={e.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{cat?.label} · ₺{Number(e.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                          {e.description && <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">{e.description}</p>}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                          e.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : e.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        }`}>
                          {e.status === 'APPROVED' ? 'Onaylı' : e.status === 'REJECTED' ? 'Red' : 'Bekliyor'}
                        </span>
                        {e.status === 'PENDING' && (
                          <button
                            onClick={() => remove(e.id)}
                            className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center justify-center shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
