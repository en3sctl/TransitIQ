"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, AlertCircle, Keyboard, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetect: (pnr: string) => void;
}

/**
 * Uses the native BarcodeDetector API (Chrome/Edge/Android). Falls back to manual input.
 * No external deps. Extracts PNR from any text or URL payload.
 */
export function QRScanner({ open, onClose, onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerLoopRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'denied' | 'unsupported'>('idle');
  const [manual, setManual] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (open) start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function start() {
    setStatus('requesting');
    setShowManual(false);

    // Check BarcodeDetector support
    const BD = (window as any).BarcodeDetector;
    if (!BD) {
      setStatus('unsupported');
      setShowManual(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new BD({ formats: ['qr_code'] });
      setStatus('scanning');

      const loop = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scannerLoopRef.current = requestAnimationFrame(loop);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const raw = codes[0].rawValue as string;
            const pnr = extractPnr(raw);
            if (pnr) {
              stop();
              onDetect(pnr);
              return;
            }
          }
        } catch {
          // detect throws on some frames — ignore
        }
        scannerLoopRef.current = requestAnimationFrame(loop);
      };
      scannerLoopRef.current = requestAnimationFrame(loop);
    } catch {
      setStatus('denied');
      setShowManual(true);
    }
  }

  function stop() {
    if (scannerLoopRef.current) {
      cancelAnimationFrame(scannerLoopRef.current);
      scannerLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus('idle');
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const pnr = extractPnr(manual.trim());
    if (!pnr) return;
    onDetect(pnr);
    setManual('');
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">PNR Tara</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera view */}
            {!showManual && (
              <div className="relative aspect-square bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-white/70 rounded-2xl relative">
                    <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                    <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />
                    {/* Animated scan line */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>

                {status === 'requesting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Kamera izni bekleniyor...</p>
                    </div>
                  </div>
                )}

                {(status === 'denied' || status === 'unsupported') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
                    <div className="text-center text-white">
                      <AlertCircle className="w-8 h-8 mx-auto mb-3" />
                      <p className="text-sm font-bold mb-2">
                        {status === 'unsupported' ? 'Bu tarayıcı QR taramayı desteklemiyor' : 'Kamera izni reddedildi'}
                      </p>
                      <p className="text-xs text-white/70">PNR kodunu elle girerek devam edebilirsin</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual input */}
            {(showManual || status === 'denied' || status === 'unsupported') && (
              <form onSubmit={submitManual} className="p-5 bg-slate-50 dark:bg-zinc-950">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
                  PNR Kodu
                </label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={manual}
                    onChange={(e) => setManual(e.target.value.toUpperCase())}
                    placeholder="TX-XXXXXXXX"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-bold outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!manual.trim()}
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm"
                  >
                    <Check className="w-4 h-4" /> Bul
                  </button>
                </div>
              </form>
            )}

            {/* Toggle manual */}
            {!showManual && status !== 'denied' && status !== 'unsupported' && (
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={() => { stop(); setShowManual(true); }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Keyboard className="w-3.5 h-3.5" /> Elle PNR gir
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Extract PNR from raw QR payload. Accepts bare PNR, URL, JSON. */
function extractPnr(raw: string): string | null {
  if (!raw) return null;
  const m = raw.toUpperCase().match(/TX-[A-Z0-9]{4,}/);
  return m ? m[0] : null;
}
