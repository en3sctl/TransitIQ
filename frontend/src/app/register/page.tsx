"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Loader2, ChevronRight, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    companyDomain: ""
  });

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
    setError(null);
    
    try {
      await api.post("/auth/register", {
        ...formData,
        email: formData.email.toLowerCase(),
        companyDomain: formData.companyDomain.toLowerCase()
      });
      setIsSuccess(true);
      setError(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Kayıt işlemi başarısız.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-zinc-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 overflow-hidden relative transition-colors duration-500">
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
        
        <div className="relative h-full flex flex-col justify-between p-16 z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-semibold tracking-widest uppercase mb-8">
              <Sparkles size={14} className="text-indigo-400" />
              Sınırsız Ölçeklenebilirlik
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter leading-[1.05] mb-6">
              Geleceği <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 animate-gradient-x bg-[length:200%_auto]">
                Seninle kuralım.
              </span>
            </h2>
            <p className="text-xl text-zinc-400 font-medium max-w-md leading-relaxed">
              Profesyonel ağınızı dakikalar içinde kurun ve operasyonlarınıza başlayın.
            </p>
            
            <div className="mt-12 space-y-4">
               {[
                 "Gerçek Zamanlı Filo Takibi",
                 "AI Destekli Akıllı Rota Optimizasyonu",
                 "Veriye Dayalı Finansal Öngörüler"
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 text-zinc-300 group/item cursor-default">
                   <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                     <CheckCircle2 size={12} strokeWidth={3} />
                   </div>
                   <span className="font-semibold text-zinc-200 group-hover/item:text-white transition-colors text-sm">{item}</span>
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

      {/* Right Side: Elegant Form Area */}
      <div className="flex items-center justify-center p-8 lg:p-24 bg-zinc-50/30 dark:bg-zinc-900/10 h-full overflow-y-auto">
        <div className="w-full max-w-[480px] space-y-10 py-12">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div 
                key="register-form"
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
                  <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">Hesap Oluştur</h1>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">Üç dakikadan kısa sürede kurumsal kaydınızı yapın.</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* ... inputs ... */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="relative group">
                      <input 
                        id="companyName"
                        placeholder=" "
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                        required
                        className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 dark:border-zinc-800 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                      />
                      <label 
                        htmlFor="companyName" 
                        className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5"
                      >
                        ŞİRKET ADI
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        id="companyDomain"
                        placeholder=" "
                        value={formData.companyDomain}
                        onChange={e => setFormData({...formData, companyDomain: e.target.value})}
                        required
                        className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 dark:border-zinc-800 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                      />
                      <label 
                        htmlFor="companyDomain" 
                        className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5"
                      >
                        ALAN ADI (SLUG)
                      </label>
                    </div>
                  </div>

                  <div className="relative group">
                    <input 
                      id="fullName"
                      placeholder=" "
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      required
                      className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 dark:border-zinc-800 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                    />
                    <label 
                      htmlFor="fullName" 
                      className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5"
                    >
                      YÖNETİCİ ADI SOYADI
                    </label>
                  </div>

                  <div className="relative group">
                    <input 
                      id="email"
                      type="email"
                      placeholder=" "
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                      className="peer w-full px-5 py-5 pt-7 rounded-[22px] border border-zinc-200 dark:border-zinc-800 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                    />
                    <label 
                      htmlFor="email" 
                      className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5"
                    >
                      E-POSTA ADRESİ
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="relative group">
                      <input 
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder=" "
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        required
                        className="peer w-full px-5 py-5 pt-7 pr-14 rounded-[22px] border border-zinc-200 dark:border-zinc-800 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                      />
                      <label 
                        htmlFor="password" 
                        className="absolute left-5 top-5 text-zinc-400 text-[10px] font-black tracking-widest transition-all pointer-events-none peer-focus:top-2.5 peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-2.5"
                      >
                        GÜÇLÜ BİR ŞİFRE SEÇİN
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
                              className={`flex-1 rounded-full transition-all duration-500 ${
                                passwordStrength >= level ? getStrengthColor() : "bg-zinc-200 dark:bg-zinc-800"
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
                          <span className="text-zinc-400 italic">Min 8 Karakter</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-black text-lg py-4 px-8 rounded-[24px] shadow-2xl shadow-zinc-300 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 group border border-zinc-900 dark:border-white mt-4"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <span>Hemen Başla</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform stroke-[3]" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[13px] text-zinc-400 font-bold uppercase tracking-wider">
                    Zaten bir hesabın var mı?{" "}
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-all underline decoration-2 underline-offset-4 hover:underline-offset-2">
                      Giriş yap
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="register-success"
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
                  <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">Hesabın Hazır!</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">Kurumsal profilin başarıyla oluşturuldu.</p>
                </div>
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-black px-8 py-4 rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 group uppercase tracking-widest mt-4"
                >
                  Giriş Yap <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
