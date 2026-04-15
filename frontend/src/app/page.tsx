import SearchForm from "@/components/search-form";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import { PopularRoutes } from "@/components/landing/popular-routes";
import { CheapTrips } from "@/components/landing/cheap-trips";
import { Features } from "@/components/landing/features";
import { B2BCta } from "@/components/landing/b2b-cta";
import { LiveTicker } from "@/components/landing/live-ticker";
import { HeroSpotlight } from "@/components/landing/hero-spotlight";
import { HeroCarousel } from "@/components/landing/hero-carousel";
import { DiscoverTurkey } from "@/components/landing/discover-turkey";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden relative">
      <LandingNav />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-36 z-10 w-full min-h-[720px]">
        <HeroCarousel />
        <HeroSpotlight />

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

          <div className="w-full max-w-4xl relative px-4">
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-3xl pointer-events-none" />
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Sections */}
      <LiveTicker />
      <PopularRoutes />
      <DiscoverTurkey />
      <CheapTrips />
      <Features />
      <B2BCta />

      <SiteFooter />
    </div>
  );
}
