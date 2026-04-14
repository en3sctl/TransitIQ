import { MoveRight } from "lucide-react";
import Image from "next/image";
import SearchForm from "@/components/search-form";
import { LandingNav } from "@/components/landing-nav";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden relative">
      <LandingNav />

      {/* Hero Section with High-Res Background */}
      <main className="flex-1 relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-36 z-10 w-full">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          {/* Top Gradient Fade to blend Navbar */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white dark:from-zinc-950 dark:via-zinc-950/40 dark:to-zinc-950 z-10" />
          <div 
            className="w-full h-full bg-[url('/otebis.png')] bg-cover bg-center opacity-95 dark:opacity-80"
          />
        </div>

        <div className="relative z-20 flex flex-col items-center w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-zinc-600 dark:text-zinc-300 text-xs font-bold mb-8 scale-95 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Yepyeni Rotalar Eklendi
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05] max-w-4xl text-zinc-900 dark:text-white mb-6 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            Türkiye'nin Her Yerine <br />
            <span className="text-indigo-600 dark:text-indigo-400">Güvenli ve Konforlu Seyahat</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-700 dark:text-zinc-300 font-semibold max-w-2xl mx-auto mb-14 leading-relaxed tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            Yüzlerce rota, en iyi fiyatlar. Hemen otobüs biletini bul ve yolculuğa başla.
          </p>

          {/* Floating Search Form Component */}
          <div className="w-full max-w-4xl relative px-4">
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-3xl pointer-events-none" />
            <SearchForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800 max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8 text-zinc-500 text-sm relative z-20 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <Image
            src="/yeni_logo.png"
            alt="TransitIQ"
            width={160}
            height={87}
            className="h-8 w-auto opacity-90"
          />
        </div>
        <div className="flex items-center gap-10 font-semibold text-zinc-600 dark:text-zinc-400">
          <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Gizlilik Politikası</a>
          <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Şartlar</a>
          <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">İletişim</a>
        </div>
        <div className="font-semibold text-zinc-400 dark:text-zinc-500">© 2026 TransitIQ Inc. Tüm hakları saklıdır.</div>
      </footer>
    </div>
  );
}
