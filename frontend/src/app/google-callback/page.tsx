"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    try {
      const queryError = params.get('error');
      if (queryError) {
        setStatus('error');
        setError(queryError);
        return;
      }

      const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
      const match = hash.match(/d=([^&]+)/);
      if (!match) {
        setStatus('error');
        setError('Geçersiz yönlendirme — token bulunamadı');
        return;
      }

      const raw = atob(match[1].replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(raw) as { token: string; user: any };
      if (!data?.token || !data?.user) {
        setStatus('error');
        setError('Kimlik bilgileri eksik');
        return;
      }

      setStatus('success');
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
        login(data.token, data.user);
      }, 700);
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || 'Beklenmeyen hata');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-10 text-center max-w-md w-full"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Google ile giriş yapılıyor...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-1">Hoş geldin!</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Hesabına yönlendiriliyorsun...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Giriş başarısız</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6">{error || 'Bir sorun oluştu.'}</p>
            <Link
              href="/hesap/giris"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm"
            >
              Giriş sayfasına dön
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
