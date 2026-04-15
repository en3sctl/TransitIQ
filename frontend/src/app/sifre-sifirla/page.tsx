"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Mail, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import api from "@/lib/api";

function PasswordResetInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [stage, setStage] = useState<'request' | 'requestSent' | 'confirm' | 'done'>(
    token ? 'confirm' : 'request',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) setStage('confirm');
  }, [token]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', { email: email.trim().toLowerCase() });
      setStage('requestSent');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function submitConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }
    if (password !== password2) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, newPassword: password });
      setStage('done');
      setTimeout(() => router.push('/hesap/giris'), 2500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Link geçersiz veya süresi dolmuş');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      <main className="max-w-md mx-auto px-6 pt-24 pb-20">
        <Link
          href="/hesap/giris"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Giriş Sayfasına Dön
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8"
        >
          {stage === 'request' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Şifreni sıfırla</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6 leading-relaxed">
                E-posta adresini gir, şifreni sıfırlamak için bağlantı gönderelim.
              </p>

              <form onSubmit={submitRequest} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Sıfırlama Bağlantısı Gönder
                </button>
              </form>
            </>
          )}

          {stage === 'requestSent' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                Kontrol et
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed mb-4">
                Eğer bu email bir hesapla eşleşiyorsa, sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi. Bağlantı <strong>30 dakika</strong> geçerli.
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium leading-relaxed">
                Gelmediyse spam klasörünü kontrol et. Hâlâ yoksa 5 dakika sonra tekrar dene.
              </p>
            </>
          )}

          {stage === 'confirm' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Yeni şifre belirle</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6">
                En az 6 karakter. Güçlü bir şifre seç, kolay tahmin edilebilecek kelimelerden kaçın.
              </p>

              <form onSubmit={submitConfirm} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Yeni Şifre</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Şifreyi Tekrar Gir</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Şifreyi Güncelle
                </button>
              </form>
            </>
          )}

          {stage === 'done' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                Şifren güncellendi
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                Giriş sayfasına yönlendiriliyorsun...
              </p>
            </div>
          )}
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={null}>
      <PasswordResetInner />
    </Suspense>
  );
}
