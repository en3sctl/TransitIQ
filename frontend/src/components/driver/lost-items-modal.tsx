"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Loader2, Check, XCircle, HandHelping, Phone, User, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { promptDialog } from "@/components/ui/dialogs";

interface Props {
  tripId: string | null;
  onClose: () => void;
}

interface LostItem {
  id: string;
  reporterName: string;
  reporterPhone: string | null;
  itemDescription: string;
  seatNumber: number | null;
  status: 'REPORTED' | 'FOUND' | 'NOT_FOUND' | 'CLAIMED';
  driverNote: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  REPORTED: { label: 'Açık', cls: 'bg-amber-500 text-white' },
  FOUND: { label: 'Bulundu', cls: 'bg-emerald-500 text-white' },
  NOT_FOUND: { label: 'Bulunamadı', cls: 'bg-slate-500 text-white' },
  CLAIMED: { label: 'Teslim Edildi', cls: 'bg-indigo-500 text-white' },
};

export function LostItemsModal({ tripId, onClose }: Props) {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const res = await api.get(`/driver-ops/trips/${tripId}/lost-items`);
      setItems(res.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tripId) load(); /* eslint-disable-next-line */ }, [tripId]);

  const mark = async (item: LostItem, status: 'FOUND' | 'NOT_FOUND' | 'CLAIMED') => {
    let note: string | null = '';
    if (status === 'FOUND') {
      note = await promptDialog({
        title: 'Eşya bulundu',
        message: 'Nerede bulduğun kısa bir not (muhafaza için yararlı).',
        label: 'Not',
        placeholder: 'Örn: Koltuk altında, bagajlı bölümde, vb.',
        confirmLabel: 'Bulundu İşaretle',
        variant: 'success',
      });
    } else if (status === 'NOT_FOUND') {
      note = await promptDialog({
        title: 'Bulunamadı',
        message: 'Yolcuya geri dönüş için not bırakabilirsin.',
        label: 'Not',
        placeholder: 'Örn: Sefer sonunda tüm koltuklar kontrol edildi, bulunamadı.',
        confirmLabel: 'Bulunamadı İşaretle',
        variant: 'warning',
      });
    } else if (status === 'CLAIMED') {
      note = await promptDialog({
        title: 'Sahibine teslim edildi',
        message: 'Yolcu eşyayı aldı mı? Kime teslim ettiğinin kısa bilgisi.',
        label: 'Not',
        placeholder: 'Örn: Kastamonu otogarında kendisine teslim edildi.',
        confirmLabel: 'Teslim Edildi İşaretle',
        variant: 'success',
      });
    }
    if (note === null) return;
    setActing(item.id);
    try {
      await api.patch(`/driver-ops/lost-items/${item.id}`, { status, note: note || undefined });
      toast.success('Güncellendi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    } finally { setActing(null); }
  };

  if (!tripId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl max-h-[92vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="bg-amber-500 text-white p-5 flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black tracking-tight">Kayıp Eşyalar</h3>
              <p className="text-xs font-medium opacity-90">Bu seferde yolcuların aradığı eşyalar</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/15">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading ? (
              <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm font-bold text-slate-500">Bu sefere bildirilen eşya yok</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Yolcu sefer sonrası "Bilet Takip" üzerinden bildirir.</p>
              </div>
            ) : (
              items.map((it) => {
                const meta = STATUS_META[it.status];
                return (
                  <div key={it.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-base font-black text-slate-900 dark:text-white">{it.itemDescription}</p>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${meta.cls}`}>{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 font-medium flex-wrap">
                          <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {it.reporterName}</span>
                          {it.reporterPhone && (
                            <a href={`tel:${it.reporterPhone}`} className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline">
                              <Phone className="w-3 h-3" /> {it.reporterPhone}
                            </a>
                          )}
                          {it.seatNumber != null && <span>Koltuk: <strong>{it.seatNumber}</strong></span>}
                          <span><Clock className="w-3 h-3 inline mr-1" />{new Date(it.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {it.driverNote && (
                          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium italic mt-2">"{it.driverNote}"</p>
                        )}
                      </div>
                    </div>
                    {it.status === 'REPORTED' && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => mark(it, 'FOUND')}
                          disabled={acting === it.id}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 active:scale-95 transition-transform"
                        >
                          <Check className="w-3.5 h-3.5" /> Bulundu
                        </button>
                        <button
                          onClick={() => mark(it, 'NOT_FOUND')}
                          disabled={acting === it.id}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50 active:scale-95 transition-transform"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Bulunamadı
                        </button>
                        <button
                          onClick={() => mark(it, 'CLAIMED')}
                          disabled={acting === it.id}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 active:scale-95 transition-transform"
                        >
                          <HandHelping className="w-3.5 h-3.5" /> Teslim
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
