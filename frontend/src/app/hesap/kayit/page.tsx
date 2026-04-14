"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Loader2, ChevronRight, Eye, EyeOff, Sparkles, CheckCircle2, Ticket, ShieldCheck, Bus, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

export default function CustomerRegisterPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    referralCode: "",
  });

  // Auto-fill referral code from ?ref= URL param
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData((f) => ({ ...f, referralCode: ref.toUpperCase() }));
    }
  }, [searchParams]);

  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const pwd = formData.password;
    if (!pwd) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "bg-zinc-200";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, string> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };
      const cleanPhone = formData.phone.replace(/\s/g, '');
      if (cleanPhone) payload.phone = cleanPhone;

      const cleanRef = formData.referralCode.trim().toUpperCase();
      if (cleanRef) payload.referralCode = cleanRef;

      const res = await api.post("/auth/customer/register", payload);
      // Auto-login after successful registration
      login(res.data.access_token, res.data.user, '/hesap/biletlerim');
    } catch (err: any) {
      const msg = err.response?.data?.message || "Kayıt işlemi başarısız.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-zinc-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 overflow-hidden relative transition-colors duration-500">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side: Hero */}
      <div className="hidden lg:block relative group h-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80"
          alt="Yolculuk"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90" />

        <div className="relative h-full flex flex-col justify-between p-16 z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-semibold tracking-widest uppercase mb-8">
              <Sparkles size={14} className="text-emerald-400" />
              Tek hesap, sınırsız yolculuk
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter leading-[1.05] mb-6">
              Yolculuğun <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 animate-gradient-x bg-[length:200%_auto]">
                konforla başlasın.
              </span>
            </h2>
            <p className="text-xl text-zinc-400 font-medium max-w-md leading-relaxed">
              Biletlerini yönet, geçmişine göz at, indirimlerden anında faydalan.
            </p>

            <div className="mt-12 space-y-4">
              {[
                { icon: Ticket, text: "Tüm biletlerini tek yerde gör" },
                { icon: ShieldCheck, text: "Hesap güvenliği ve 3D Secure ödeme" },
                { icon: Bus, text: "Seferlere 2 tıkla hızlı geri dönüş" }
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-4 text-zinc-300 group/item cursor-default">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Icon size={15} strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-zinc-200 group-hover/item:text-white transition-colors text-sm">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-4 text-white/20 select-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <div className="text-4xl font-black italic tracking-tighter">TRANSITIQ</div>
            <div className="h-px w-24 bg-white/10" />
          </motion.div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex items-center justify-center p-8 lg:p-24 bg-zinc-50/30 dark:bg-zinc-900/10 h-full overflow-y-auto">
        <div className="w-full max-w-[480px] space-y-10 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key="customer-register-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="space-y-10"
            >
              <div className="space-y-3">
                <div className="lg:hidden flex items-center mb-10">
                  <BrandLogo width={220} height={120} priority className="h-12 w-auto" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">Hoş geldin!</h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">
                  Biletlerini tek bir yerden yönet, seferlerde öncelikli ol.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="relative group">
                    <input
                      id="firstName"
                      placeholder=" "
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 dark:focus:border-indigo-500 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                    />
                    <label htmlFor="firstName" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5">
                      AD
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      id="lastName"
                      placeholder=" "
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 dark:focus:border-indigo-500 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                    />
                    <label htmlFor="lastName" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5">
                      SOYAD
                    </label>
                  </div>
                </div>

                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    placeholder=" "
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 dark:focus:border-indigo-500 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                  />
                  <label htmlFor="email" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5">
                    E-POSTA ADRESİ
                  </label>
                </div>

                <div className="relative group">
                  <input
                    id="phone"
                    type="tel"
                    placeholder=" "
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 dark:focus:border-indigo-500 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                  />
                  <label htmlFor="phone" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5">
                    TELEFON (İSTEĞE BAĞLI)
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=" "
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      className="peer w-full px-5 py-5 pt-7 pr-14 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 dark:focus:border-indigo-500 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                    />
                    <label htmlFor="password" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5">
                      ŞİFRE
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-indigo-600 transition-all focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="px-1 space-y-2 animate-in fade-in duration-300">
                      <div className="flex gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all duration-500 ${passwordStrength >= level ? getStrengthColor() : "bg-zinc-200 dark:bg-zinc-800"
                              }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className={passwordStrength > 0 ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400"}>
                          {passwordStrength === 1 ? "Çok Zayıf" :
                            passwordStrength === 2 ? "Zayıf" :
                              passwordStrength === 3 ? "Güçlü" :
                                passwordStrength === 4 ? "Mükemmel" : "Şifre Gücü"}
                        </span>
                        <span className="text-zinc-400 italic">Min 6 Karakter</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Referral code */}
                <div className="relative group">
                  <input
                    id="referralCode"
                    type="text"
                    placeholder=" "
                    value={formData.referralCode}
                    onChange={e => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                    maxLength={20}
                    className="peer w-full px-5 py-5 pt-7 pr-14 rounded-[22px] border border-zinc-200 focus:border-emerald-500 outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 uppercase tracking-widest"
                  />
                  <label htmlFor="referralCode" className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-emerald-600 peer-[:not(:placeholder-shown)]:top-2.5">
                    REFERANS KODU (İSTEĞE BAĞLI)
                  </label>
                  <Gift size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500" />
                </div>
                {formData.referralCode && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 flex items-center gap-1.5">
                    <Sparkles size={12} /> Kayıt olunca ikinize de 50₺ kredi
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-black text-lg py-4 px-8 rounded-[24px] shadow-2xl shadow-zinc-300 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 group border border-zinc-900 dark:border-white mt-4"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <span>Hesap Oluştur</span>
                      <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform stroke-[3]" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <p className="text-[13px] text-zinc-400 font-bold uppercase tracking-wider">
                  Zaten hesabın var mı?{" "}
                  <Link href="/hesap/giris" className="text-indigo-600 hover:text-indigo-700 font-bold transition-all underline decoration-2 underline-offset-4 hover:underline-offset-2">
                    Giriş yap
                  </Link>
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Misafir olarak bilet mi aldın?{" "}
                  <Link href="/bilet-takip" className="text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 font-semibold transition-all">
                    PNR ile takip et
                  </Link>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
