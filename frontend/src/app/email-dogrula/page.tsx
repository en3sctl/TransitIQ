"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import api from "@/lib/api";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token eksik');
      return;
    }
    (async () => {
      try {
        await api.post('/auth/verify-email/confirm', { token });
        setStatus('success');
      } catch (e: any) {
        setStatus('error');
        setError(e.response?.data?.message || 'Link geçersiz veya süresi dolmuş');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      <main className="max-w-md mx-auto px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 text-center"
        >
          {status === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Doğrulanıyor...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                E-posta doğrulandı
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6">
                Hesabın artık aktif. Tüm özelliklerden yararlanabilirsin.
              </p>
              <Link
                href="/hesap/biletlerim"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm"
              >
                Biletlerime Git
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-4">
                <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                Doğrulama başarısız
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6">
                {error || 'Link geçersiz veya süresi dolmuş olabilir.'}
              </p>
              <Link
                href="/hesap/biletlerim"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm"
              >
                <Mail className="w-4 h-4" /> Yeni Link İste
              </Link>
            </>
          )}
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
