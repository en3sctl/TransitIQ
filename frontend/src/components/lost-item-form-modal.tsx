"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatPhoneTR } from "@/lib/formatters";

interface Props {
  open: boolean;
  onClose: () => void;
  pnrCode: string;
  defaultName?: string;
  defaultPhone?: string;
}

/**
 * Yolcu tarafında kayıp eşya bildirim modal'ı.
 * Geçmiş biletinde "Eşyamı kaybettim" butonuna basınca açılır.
 */
export function LostItemFormModal({ open, onClose, pnrCode, defaultName, defaultPhone }: Props) {
  const [reporterName, setReporterName] = useState(defaultName || '');
  const [reporterPhone, setReporterPhone] = useState(defaultPhone || '');
  const [itemDescription, setItemDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!reporterName.trim()) { toast.error('Ad soyad girmelisin'); return; }
    if (itemDescription.length < 5) { toast.error('Eşya açıklaması en az 5 karakter'); return; }
    setSubmitting(true);
    try {
      await api.post('/driver-ops/lost-items', {
        pnrCode,
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone || undefined,
        itemDescription: itemDescription.trim(),
      });
      setSent(true);
      toast.success('Bildirim firma/şoföre iletildi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gönderilemedi');
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="bg-amber-500 text-white p-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black tracking-tight">Otobüste Eşya mı Unuttun?</h3>
              <p className="text-xs font-medium opacity-90">PNR: {pnrCode}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/15">
              <X className="w-5 h-5" />
            </button>
          </div>

          {sent ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-lg font-black text-slate-900 dark:text-white">Bildirim ulaştı!</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
                Firma ve şoför eşyanı aramaya başladı. Bulunduğunda seni telefonla arayacağız.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
              >
                Tamam
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
                  Ne unuttun?
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Ör: Siyah, kapkara Samsung telefon. Ekran arkasında kılıfı kırmızı..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm font-medium focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none resize-none"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Detay ver: renk, marka, nerede unuttuğun (koltuk altı, bagaj vb.)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
                    Adın
                  </label>
                  <input
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm font-semibold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
                    Telefon (ulaşma için)
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(formatPhoneTR(e.target.value))}
                    placeholder="0532 123 45 67"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm font-semibold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-lg disabled:opacity-50 active:scale-95 transition-transform inline-flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Bildirimi Gönder
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
