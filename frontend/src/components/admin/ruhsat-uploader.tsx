"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, CheckCircle2, AlertCircle, X, ShieldCheck, Eye } from "lucide-react";
import { parseRuhsatImage, type RuhsatData } from "@/lib/ruhsat-parser";

interface Props {
  /** Called with extracted data once OCR finishes. Parent can choose which fields to apply. */
  onExtract: (data: RuhsatData) => void;
}

/**
 * Client-side Tesseract OCR for Turkish vehicle registration documents (ruhsat).
 * Data NEVER leaves the browser — OCR runs in WebWorker.
 */
export function RuhsatUploader({ onExtract }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'reading' | 'done' | 'error'>('idle');
  const [extracted, setExtracted] = useState<RuhsatData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus('reading');
    setProgress(0);
    setExtracted(null);
    setErrorMsg(null);

    try {
      const data = await parseRuhsatImage(f, (p) => setProgress(p));
      setExtracted(data);
      setStatus('done');
      onExtract(data);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message || 'OCR başarısız oldu');
    }
  }

  function clear() {
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setStatus('idle');
    setExtracted(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const detectedCount = extracted
    ? [extracted.plate, extracted.chassis, extracted.engine, extracted.make, extracted.model, extracted.year, extracted.color, extracted.fuel].filter(Boolean).length
    : 0;

  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Ruhsat OCR (İsteğe Bağlı)
        </p>
      </div>
      <p className="text-[10px] font-medium text-emerald-800/80 dark:text-emerald-300/80 mb-3 leading-relaxed">
        Ruhsat fotoğrafını yükle, plaka/marka/model/şasi bilgileri otomatik doldurulsun.
        Görüntü <strong>sunucuya gönderilmez</strong> — tüm işlem cihazında çalışır.
      </p>

      {status === 'idle' && !file && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
          >
            <Upload className="w-4 h-4" /> Ruhsat Fotoğrafı Yükle
          </button>
        </>
      )}

      <AnimatePresence mode="wait">
        {file && (
          <motion.div
            key="file-view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-emerald-500/20 rounded-xl">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Ruhsat önizleme"
                  className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate mb-1">{file.name}</p>

                {status === 'reading' && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        Okunuyor... %{Math.round(progress * 100)}
                      </p>
                    </div>
                    <div className="h-1 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500"
                        animate={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {status === 'done' && extracted && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {detectedCount} alan tespit edildi (%{Math.round(extracted.confidence)})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[9px] font-semibold">
                      {extracted.plate && <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">Plaka: {extracted.plate}</span>}
                      {extracted.make && <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">{extracted.make}</span>}
                      {extracted.model && <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">{extracted.model}</span>}
                      {extracted.year && <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">{extracted.year}</span>}
                      {extracted.chassis && <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono">{extracted.chassis.slice(0, 8)}...</span>}
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-1.5 italic">
                      Alanlar form'a dolduruldu. Lütfen doğrulayıp düzenle.
                    </p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                      {errorMsg || 'Okunamadı. Bilgileri elle gir.'}
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={clear}
                aria-label="Temizle"
                className="shrink-0 w-6 h-6 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
