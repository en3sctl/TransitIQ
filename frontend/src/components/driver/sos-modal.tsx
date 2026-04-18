"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2, Phone, Mail, Car, Stethoscope, ShieldAlert, Wrench, MoreHorizontal, MapPin } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Props {
  tripId: string | null;
  onClose: () => void;
  coords?: { lat: number; lng: number } | null;
}

type SosCategory = 'ACCIDENT' | 'MEDICAL' | 'MECHANICAL' | 'SECURITY' | 'OTHER';

const CATEGORIES: { key: SosCategory; label: string; icon: any; tone: string }[] = [
  { key: 'ACCIDENT', label: 'Kaza', icon: Car, tone: 'bg-rose-600 hover:bg-rose-700' },
  { key: 'MEDICAL', label: 'Sağlık', icon: Stethoscope, tone: 'bg-pink-600 hover:bg-pink-700' },
  { key: 'MECHANICAL', label: 'Arıza', icon: Wrench, tone: 'bg-amber-600 hover:bg-amber-700' },
  { key: 'SECURITY', label: 'Güvenlik', icon: ShieldAlert, tone: 'bg-indigo-600 hover:bg-indigo-700' },
  { key: 'OTHER', label: 'Diğer', icon: MoreHorizontal, tone: 'bg-slate-700 hover:bg-slate-800' },
];

export function SosModal({ tripId, onClose, coords }: Props) {
  const [step, setStep] = useState<'select' | 'sending' | 'sent'>('select');
  const [category, setCategory] = useState<SosCategory | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ supportPhone: string | null; supportEmail: string | null } | null>(null);

  useEffect(() => {
    if (tripId) {
      setStep('select');
      setCategory(null);
      setNote('');
      setResult(null);
    }
  }, [tripId]);

  const send = async (cat: SosCategory) => {
    if (!tripId) return;
    setCategory(cat);
    setStep('sending');
    try {
      const res = await api.post(`/driver-ops/trips/${tripId}/sos`, {
        category: cat,
        note: note || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      setResult({
        supportPhone: res.data?.supportPhone || null,
        supportEmail: res.data?.supportEmail || null,
      });
      setStep('sent');
      toast.success('SOS gönderildi — destek ekibi bilgilendirildi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'SOS gönderilemedi');
      setStep('select');
    }
  };

  if (!tripId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-rose-500/20"
        >
          {/* Header */}
          <div className="bg-rose-600 text-white p-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black tracking-tight">Acil Durum Bildir</h3>
              <p className="text-xs font-medium opacity-90">Destek ekibi anında bilgilendirilir</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/15">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'select' && (
            <div className="p-5 space-y-4">
              {/* Hayat tehlikesiyse önce 112, sonra sistem kaydı */}
              <a
                href="tel:112"
                className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl p-4 active:scale-95 transition-transform shadow-xl shadow-red-600/30 border-2 border-red-400"
              >
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Hayati tehlike varsa</p>
                  <p className="text-xl font-black tracking-tight">Önce 112'yi ARA</p>
                  <p className="text-[11px] font-bold opacity-85">Sonra aşağıdan kategori seç — sistem kaydı paralelde oluşur</p>
                </div>
              </a>

              <p className="text-sm font-bold text-slate-900 dark:text-white pt-1">Acil durum türü</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.key}
                      onClick={() => send(c.key)}
                      className={`${c.tone} text-white rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-md`}
                    >
                      <Icon className="w-7 h-7" />
                      <span className="text-sm font-black tracking-tight">{c.label}</span>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
                  Not (opsiyonel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Detay yazabilirsin, zaman kaybetme..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-sm font-medium focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none resize-none"
                />
              </div>
              {coords && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-mono font-bold">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                  <span className="ml-auto">konum paylaşılacak</span>
                </div>
              )}
            </div>
          )}

          {step === 'sending' && (
            <div className="p-10 text-center">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Gönderiliyor...
              </p>
            </div>
          )}

          {step === 'sent' && (
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4">
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-200 mb-1">
                  ✓ Bildirim gönderildi
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                  {CATEGORIES.find((c) => c.key === category)?.label} kaydı denetim loguna işlendi, destek ekibine e-posta ulaştı.
                </p>
              </div>

              {/* 112 KATILMAZ acil — Kaza/Sağlık/Güvenlik kategorilerinde büyük kırmızı buton */}
              {(category === 'ACCIDENT' || category === 'MEDICAL' || category === 'SECURITY') && (
                <a
                  href="tel:112"
                  className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl p-5 active:scale-95 transition-transform shadow-2xl shadow-red-600/40 border-2 border-red-400"
                >
                  <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Acil Çağrı Merkezi</p>
                    <p className="text-2xl font-black tracking-tight">112'yi ARA</p>
                    <p className="text-[11px] font-bold opacity-80 mt-0.5">Kaza, sağlık sorunu veya güvenlik tehdidi — acil çağrı merkezini ara</p>
                  </div>
                </a>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  Firma destek
                </p>
                {result?.supportPhone ? (
                  <a
                    href={`tel:${result.supportPhone}`}
                    className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-4 active:scale-95 transition-transform"
                  >
                    <Phone className="w-6 h-6" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Firma admin'i ara</p>
                      <p className="text-lg font-black">{result.supportPhone}</p>
                    </div>
                  </a>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2.5">
                    Firma destek telefonu tanımlı değil. Firma admin ile WhatsApp/e-posta üzerinden iletişime geç.
                  </p>
                )}
                {result?.supportEmail && (
                  <a
                    href={`mailto:${result.supportEmail}`}
                    className="flex items-center gap-3 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-2xl p-3.5 hover:bg-slate-200 dark:hover:bg-zinc-700"
                  >
                    <Mail className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-bold">{result.supportEmail}</span>
                  </a>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700"
              >
                Kapat
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
