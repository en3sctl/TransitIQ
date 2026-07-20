"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, ChevronRight, ArrowLeft, KeyRound } from "lucide-react";
import api from "@/lib/api";

interface VerifiedUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "OPERATOR" | "DRIVER" | "PASSENGER";
  tenantId: string;
}

interface TwoFactorChallengeProps {
  /** Parola adımından dönen kısa ömürlü token. */
  challengeToken: string;
  /** Challenge'ın geçerlilik süresi — geri sayım için. */
  expiresInSec?: number;
  onVerified: (accessToken: string, user: VerifiedUser) => void;
  onCancel: () => void;
}

function formatRemaining(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Login'in ikinci adımı. Parola doğru ama hesapta 2FA açıksa gösterilir —
 * bu ekran geçilmeden oturum açılmaz (token backend'de burada üretilir).
 */
export function TwoFactorChallenge({
  challengeToken,
  expiresInSec = 300,
  onVerified,
  onCancel,
}: TwoFactorChallengeProps) {
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(expiresInSec);
  const inputRef = useRef<HTMLInputElement>(null);
  // Aynı kodun iki kez POST edilmesini engeller (auto-submit + Enter yarışı)
  const inFlightRef = useRef(false);

  const expired = remaining <= 0;

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => (r <= 0 ? 0 : r - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [useBackup]);

  const submit = useCallback(
    async (value: string) => {
      const clean = value.trim();
      if (!clean || inFlightRef.current || expired) return;

      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const res = await api.post("/auth/2fa/login", { challengeToken, code: clean });
        onVerified(res.data.access_token, res.data.user);
      } catch (err: any) {
        const msg = err.response?.data?.message || "Doğrulama başarısız.";
        setError(Array.isArray(msg) ? msg[0] : msg);
        setCode("");
        inFlightRef.current = false;
        inputRef.current?.focus();
      } finally {
        setLoading(false);
      }
    },
    [challengeToken, expired, onVerified],
  );

  // 6 hane girilir girilmez otomatik gönder — kullanıcıyı butona zorlamayalım
  useEffect(() => {
    if (!useBackup && code.length === 6) void submit(code);
  }, [code, useBackup, submit]);

  const handleChange = (raw: string) => {
    setError(null);
    setCode(
      useBackup
        ? raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10)
        : raw.replace(/\D/g, "").slice(0, 6),
    );
  };

  const switchMode = () => {
    setUseBackup((v) => !v);
    setCode("");
    setError(null);
  };

  return (
    <motion.div
      key="twofactor-step"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-8"
    >
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-[22px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
          <ShieldCheck size={30} strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
          İki adımlı doğrulama
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">
          {useBackup
            ? "Yedek kodlarından birini gir. Her kod yalnızca bir kez kullanılabilir."
            : "Doğrulama uygulamandaki 6 haneli kodu gir."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      {expired && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-sm font-semibold">
          Doğrulama süresi doldu. Baştan giriş yapman gerekiyor.
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(code);
        }}
        className="space-y-6"
      >
        <div className="relative group">
          <input
            ref={inputRef}
            id="twofactor-code"
            type="text"
            inputMode={useBackup ? "text" : "numeric"}
            autoComplete="one-time-code"
            placeholder=" "
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            disabled={expired || loading}
            className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:focus:border-indigo-500 font-bold text-2xl tracking-[0.35em] shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 disabled:opacity-50"
          />
          <label
            htmlFor="twofactor-code"
            className="absolute left-5 top-5 text-zinc-400 text-sm font-medium transition-all pointer-events-none peer-focus:text-[11px] peer-focus:top-2.5 peer-focus:text-indigo-600 peer-focus:font-bold peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:font-bold tracking-wide"
          >
            {useBackup ? "YEDEK KOD" : "DOĞRULAMA KODU"}
          </label>
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={switchMode}
            className="inline-flex items-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            <KeyRound size={13} />
            {useBackup ? "Uygulama kodunu kullan" : "Yedek kod kullan"}
          </button>
          {!expired && (
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest tabular-nums">
              {formatRemaining(remaining)}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || expired || !code}
          className="w-full h-16 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-black text-lg py-4 px-8 rounded-[24px] shadow-2xl shadow-zinc-300 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 group border border-zinc-900 dark:border-white"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <span>Doğrula</span>
              <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform stroke-[3]" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-[13px] text-zinc-400 font-bold uppercase tracking-wider hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Girişe dön
        </button>
      </div>
    </motion.div>
  );
}
