"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/context/auth-context";
import { User, Ticket, LogOut, ChevronDown, LayoutDashboard, Settings, Loader2, Wallet, Bell, Award, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingNav() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full border-b border-zinc-200/80 dark:border-zinc-800 relative z-30 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 sticky top-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <BrandLogo width={300} height={164} priority className="h-16 md:h-20 w-auto select-none" />
      </Link>

      {/* Center Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-600 dark:text-zinc-400">
        <Link href="/rotalar" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Rotalar</Link>
        <Link href="/fiyatlandirma" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Fiyatlandırma</Link>
        <Link href="/hakkimizda" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Hakkımızda</Link>
        <Link href="/bilet-takip" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Biletimi Bul</Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ModeToggle />
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        {loading ? (
          <div className="w-32 h-10 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          </div>
        ) : user ? (
          // ─── Logged-in state ───
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight max-w-[120px] truncate">
                  {user.name?.split(' ')[0] || 'Hesap'}
                </p>
                <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
                  {user.role === 'PASSENGER' ? 'Yolcu' : user.role === 'COMPANY_ADMIN' ? 'Yönetici' : user.role === 'DRIVER' ? 'Sürücü' : 'Hesap'}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1.5">
                    {user.role === 'PASSENGER' && (
                      <>
                        <Link href="/hesap/biletlerim" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <Ticket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          Biletlerim
                        </Link>
                        <Link href="/hesap/cuzdan" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Cüzdan
                        </Link>
                        <Link href="/hesap/fiyat-alarmlari" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          Fiyat Alarmları
                        </Link>
                        <Link href="/hesap/rozetler" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Rozetler
                        </Link>
                        <Link href="/hesap/davet" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <Gift className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          Arkadaş Davet Et
                        </Link>
                        <Link href="/hesap/profil" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <User className="w-4 h-4 text-zinc-500" />
                          Profil Ayarları
                        </Link>
                      </>
                    )}
                    {(user.role === 'COMPANY_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'OPERATOR') && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Yönetim Paneli
                      </Link>
                    )}
                    {user.role === 'DRIVER' && (
                      <Link
                        href="/driver"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Sürücü Paneli
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 py-1.5">
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          // ─── Guest state ───
          <>
            <Link href="/hesap/giris">
              <Button variant="ghost" className="text-sm rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold">Giriş Yap</Button>
            </Link>
            <Link href="/hesap/kayit">
              <Button className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white rounded-xl text-sm shadow-sm font-semibold px-5">Kayıt Ol</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
