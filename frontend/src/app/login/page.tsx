"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import Link from "next/link";
import { Loader2, LogIn, ChevronRight, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setError(null);
    
    try {
      const res = await api.post("/auth/login", {
        ...formData,
        email: formData.email.toLowerCase()
      });
      
      setIsSuccess(true);
      setError(null);
      
      // Delay to let user admire the success animation
      setTimeout(() => {
        login(res.data.access_token, res.data.user);
      }, 1000);
      
    } catch (err: any) {
      const msg = err.response?.data?.message || "Giriş yapılamadı. Şifre veya e-posta yanlış.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-zinc-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 overflow-hidden">
      {/* Theme Toggle Floating */}
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side: Premium Image Layout */}
      <div className="hidden lg:block relative group h-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80" 
          alt="Logistics Background" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90" />
        
        <div className="relative h-full flex flex-col justify-between p-16 z-10 transition-all duration-700">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-semibold tracking-widest uppercase mb-8">
              <Sparkles size={14} className="text-indigo-400" />
              Sektörün Yeni Standardı
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter leading-[1.05] mb-6">
              Lojistikte <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x bg-[length:200%_auto]">
                Zekâ ve Hız.
              </span>
            </h2>
            <p className="text-xl text-zinc-400 font-medium max-w-md leading-relaxed">
              TransitIQ ile tüm filo operasyonlarını tek bir noktadan, analiz gücüyle yönetin.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <div className="grid grid-cols-2 gap-8 border-l-2 border-indigo-500/30 pl-8">
              <div className="space-y-1">
                <p className="text-3xl font-bold text-white tracking-tight">12.4k</p>
                <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Günlük Sefer</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-white tracking-tight">99.9%</p>
                <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Tam Zamanında</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white/20 select-none">
              <div className="text-4xl font-black italic tracking-tighter">TRANSITIQ</div>
              <div className="h-px w-24 bg-white/10" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Elegant Form Area */}
      <div className="flex items-center justify-center p-8 lg:p-24 bg-zinc-50/30 dark:bg-zinc-900/10 h-full w-full">
        <div className="w-full max-w-[420px] space-y-10">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div 
                key="login-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-10"
              >
                <div className="space-y-3">
                  <div className="lg:hidden flex items-center gap-2 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold italic shadow-lg shadow-indigo-600/20">T</div>
                    <span className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">TransitIQ</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">Tekrar merhaba.</h1>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">Sistemine erişmek için giriş yap.</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ... inputs ... */}
                  <div className="space-y-5">
                    <div className="relative group">
                      <input 
                        id="email"
                        type="email"
                        placeholder=" "
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        required
                        className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 dark:focus:border-indigo-500 autofill:shadow-[inset_0_0_0_1000px_white] dark:autofill:shadow-[inset_0_0_0_1000px_#18181b] dark:[&:-webkit-autofill]:text-white font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                      />
                      <label 
                        htmlFor="email" 
                        className="absolute left-5 top-5 text-zinc-400 text-sm font-medium transition-all pointer-events-none peer-focus:text-[11px] peer-focus:top-2.5 peer-focus:text-indigo-600 peer-focus:font-bold peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:font-bold tracking-wide"
                      >
                        E-POSTA ADRESİ
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder=" "
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        required
                        className="peer w-full px-5 py-5 pt-7 pr-14 rounded-[22px] border border-zinc-200 focus:border-indigo-500 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:placeholder-zinc-500 dark:focus:border-indigo-500 autofill:shadow-[inset_0_0_0_1000px_white] dark:autofill:shadow-[inset_0_0_0_1000px_#18181b] dark:[&:-webkit-autofill]:text-white font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                      />
                      <label 
                        htmlFor="password" 
                        className="absolute left-5 top-5 text-zinc-400 text-sm font-medium transition-all pointer-events-none peer-focus:text-[11px] peer-focus:top-2.5 peer-focus:text-indigo-600 peer-focus:font-bold peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:font-bold tracking-wide"
                      >
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
                  </div>

                  <div className="flex justify-end pt-1">
                    <Link href="#" className="text-xs font-bold text-zinc-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                      Şifremi unuttum?
                    </Link>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-black text-lg py-4 px-8 rounded-[24px] shadow-2xl shadow-zinc-300 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 group border border-zinc-900 dark:border-white"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <span>Giriş Yap</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform stroke-[3]" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[13px] text-zinc-400 font-bold uppercase tracking-wider">
                    Henüz bir hesabın yok mu?{" "}
                    <Link href="/register" className="text-indigo-600 hover:text-indigo-700 transition-all underline decoration-2 underline-offset-4 hover:underline-offset-2">
                      Şimdi Kaydol
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="success-state"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                className="flex flex-col items-center justify-center text-center space-y-6 py-12"
              >
                <div className="w-24 h-24 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                  >
                    <CheckCircle2 size={48} strokeWidth={3} />
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">Giriş Başarılı!</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">Sistemine güvenle aktarılıyorsun.</p>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] pt-4">
                  <Loader2 className="animate-spin" size={14} />
                  <span>Kimlik Doğrulanıyor</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
