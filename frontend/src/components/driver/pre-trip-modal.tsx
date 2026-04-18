"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Loader2, Clipboard, Gauge, Fuel, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Props {
  tripId: string | null;
  onClose: () => void;
  onCompleted: () => void; // form kaydedilip sefer başlatıldıktan sonra
}

type CheckKey =
  | 'fuelOk' | 'tiresOk' | 'brakesOk' | 'lightsOk'
  | 'hornOk' | 'wipersOk' | 'mirrorsOk' | 'seatbeltsOk'
  | 'acOk' | 'cleanInside' | 'extinguisherOk'
  | 'firstAidOk' | 'emergencyHammerOk';

const CHECKLIST: { key: CheckKey; label: string }[] = [
  { key: 'fuelOk', label: 'Yakıt yeterli' },
  { key: 'tiresOk', label: 'Lastikler iyi durumda' },
  { key: 'brakesOk', label: 'Frenler çalışıyor' },
  { key: 'lightsOk', label: 'Farlar / sinyal / stop çalışıyor' },
  { key: 'hornOk', label: 'Korna çalışıyor' },
  { key: 'wipersOk', label: 'Silecekler çalışıyor' },
  { key: 'mirrorsOk', label: 'Aynalar düzgün' },
  { key: 'seatbeltsOk', label: 'Emniyet kemerleri sağlam' },
  { key: 'acOk', label: 'Klima / havalandırma çalışıyor' },
  { key: 'cleanInside', label: 'Araç içi temiz' },
  { key: 'extinguisherOk', label: 'Yangın söndürücü yerinde' },
  { key: 'firstAidOk', label: 'İlk yardım çantası tam' },
  { key: 'emergencyHammerOk', label: 'Cam kırıcı çekiç mevcut' },
];

type ChecksState = Record<CheckKey, boolean>;
const DEFAULT_CHECKS: ChecksState = {
  fuelOk: true, tiresOk: true, brakesOk: true, lightsOk: true,
  hornOk: true, wipersOk: true, mirrorsOk: true, seatbeltsOk: true,
  acOk: true, cleanInside: true, extinguisherOk: true,
  firstAidOk: true, emergencyHammerOk: true,
};

export function PreTripModal({ tripId, onClose, onCompleted }: Props) {
  const [checks, setChecks] = useState<ChecksState>(DEFAULT_CHECKS);
  const [odometerKm, setOdometerKm] = useState('');
  const [fuelLevelPercent, setFuelLevelPercent] = useState('');
  const [issueNote, setIssueNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tripId) {
      setChecks(DEFAULT_CHECKS);
      setOdometerKm('');
      setFuelLevelPercent('');
      setIssueNote('');
    }
  }, [tripId]);

  const toggle = (key: CheckKey) => setChecks((c) => ({ ...c, [key]: !c[key] }));
  const hasIssue = Object.values(checks).some((v) => !v);

  const submit = async () => {
    if (!tripId) return;
    if (hasIssue && !issueNote.trim()) {
      toast.error('Eksik raporladığın için kısa bir not yaz');
      return;
    }
    setSubmitting(true);
    try {
      // 1) Pre-trip kontrol kaydı
      await api.post(`/driver-ops/trips/${tripId}/pre-check`, {
        ...checks,
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
        fuelLevelPercent: fuelLevelPercent ? Number(fuelLevelPercent) : undefined,
        issueNote: issueNote || undefined,
      });
      // 2) Seferi başlat
      await api.patch(`/driver-ops/trips/${tripId}/status`, { status: 'ACTIVE' });
      toast.success(hasIssue ? 'Kontrol kaydedildi, sefer başlatıldı. Eksikler admin\'e iletildi.' : 'Sefer başlatıldı. GPS takibi aktif.');
      onCompleted();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kayıt başarısız');
    } finally {
      setSubmitting(false);
    }
  };

  if (!tripId) return null;

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
          className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="bg-indigo-600 text-white p-5 flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Clipboard className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black tracking-tight">Sefer Öncesi Kontrol</h3>
              <p className="text-xs font-medium opacity-90">13 maddelik liste — sefere çıkmadan önce doldur</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/15">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Odometre + yakıt */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-3 h-3" /> Kilometre
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value.replace(/\D/g, ''))}
                  placeholder="Örn: 285640"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-base font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Fuel className="w-3 h-3" /> Yakıt %
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={fuelLevelPercent}
                  onChange={(e) => setFuelLevelPercent(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="Örn: 75"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-base font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
                Kontrol listesi — sorun yoksa ✓, varsa ✗
              </p>
              {CHECKLIST.map((item) => {
                const ok = checks[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggle(item.key)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all active:scale-[0.99] ${
                      ok
                        ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-rose-50 dark:bg-rose-500/5 border-rose-300 dark:border-rose-500/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {ok ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
                    </div>
                    <span className={`flex-1 text-left font-bold ${
                      ok ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sorun varsa not zorunlu */}
            {hasIssue && (
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> Detay (zorunlu)
                </label>
                <textarea
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  rows={3}
                  placeholder="Hangi sorun? Sefer çıkabilir mi yoksa beklenmeli mi? Admin bilgilendirilecek."
                  className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5 text-sm font-medium focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-3 shrink-0 bg-slate-50/50 dark:bg-zinc-950/50">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-sm disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-base shadow-lg active:scale-95 transition-all ${
                hasIssue
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
              ) : hasIssue ? (
                <><AlertTriangle className="w-4 h-4" /> Eksikle Başlat</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Onayla & Sefere Çık</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
