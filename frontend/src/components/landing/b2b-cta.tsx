"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Check, ArrowRight } from "lucide-react";

const BENEFITS = [
  'Tam entegre bilet satış & rezervasyon altyapısı',
  'Filo, şoför ve sefer yönetim paneli',
  'Iyzico üzerinden doğrudan firma hesabına ödeme',
  'Kurulum ücretsiz — 14 gün ücretsiz deneme',
];

export function B2BCta() {
  return (
    <section className="py-20 px-6 bg-indigo-700 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-bold mb-5 border border-white/20">
              <Building2 className="w-3.5 h-3.5" />
              Otobüs Firmaları İçin
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4 leading-[1.05]">
              Firman TransitIQ ile büyüsün
            </h2>
            <p className="text-base md:text-lg text-indigo-100 font-medium mb-8 max-w-xl leading-relaxed">
              Yolcu satışı, operasyon yönetimi ve raporlama tek platformda. Teknoloji altyapısını dert etme — sen işini büyüt.
            </p>
            <div className="space-y-3 mb-8">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  <p className="text-sm md:text-base text-indigo-50 font-medium">{b}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/fiyatlandirma"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl text-sm hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
              >
                Fiyatlandırmayı Gör <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/25 transition-colors"
              >
                Demo Talep Et
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            {/* Mock admin panel card */}
            <div className="relative rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-white/40 shadow-2xl overflow-hidden p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">admin.transitiq.com</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Bugün', value: '47', sub: 'Rezervasyon' },
                  { label: 'Ciro', value: '₺12.4K', sub: 'Bu hafta' },
                  { label: 'Doluluk', value: '%82', sub: 'Ortalama' },
                ].map((s) => (
                  <div key={s.label} className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                    <p className="text-[9px] text-slate-500 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { from: 'İstanbul', to: 'Ankara', time: '09:00', price: '₺450' },
                  { from: 'Ankara', to: 'İzmir', time: '14:30', price: '₺380' },
                  { from: 'İstanbul', to: 'Bursa', time: '18:00', price: '₺220' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-800 rounded-lg border border-slate-100 dark:border-zinc-700">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-200">{t.from} → {t.to}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400">{t.time}</span>
                      <span className="text-[11px] font-black text-indigo-600">{t.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl shadow-emerald-500/30 rotate-6">
              Ücretsiz Deneme
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
