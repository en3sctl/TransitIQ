"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Zap, Headset, Smartphone, Search, MousePointerClick, CreditCard, Mail } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: '256-bit SSL Güvenliği',
    desc: 'Iyzico & PCI-DSS sertifikalı altyapı. Kart bilgilerin sunucumuzda saklanmaz.',
    color: 'emerald',
  },
  {
    icon: Zap,
    title: 'Anında PDF Bilet',
    desc: 'Ödeme sonrası saniyeler içinde QR kodlu PDF biletin e-postana gelir.',
    color: 'amber',
  },
  {
    icon: Headset,
    title: '7/24 Müşteri Desteği',
    desc: 'E-posta ve WhatsApp üzerinden her an ulaşılabilir destek ekibi.',
    color: 'indigo',
  },
  {
    icon: Smartphone,
    title: 'Tam Mobil Uyumlu',
    desc: 'Tüm cihazlarda akıcı deneyim. Biletin QR kodu telefondan da gösterilir.',
    color: 'rose',
  },
];

const STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Ara',
    desc: 'Kalkış ve varış şehrini seç, tarih belirle.',
  },
  {
    icon: MousePointerClick,
    step: '02',
    title: 'Seç',
    desc: 'Uygun seferleri karşılaştır, koltuğunu belirle.',
  },
  {
    icon: CreditCard,
    step: '03',
    title: 'Öde',
    desc: 'Güvenli ödemeyi tamamla, biletin hazır.',
  },
];

const COLORS: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export function Features() {
  return (
    <section className="py-20 px-6 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        {/* Features grid */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-4">
              Neden TransitIQ?
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">
              Daha akıllı bir bilet deneyimi
            </h2>
            <p className="text-base text-slate-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
              Modern yolculuk için tasarlandı. Hız, güvenlik ve sadelik ilk günden itibaren önceliğimiz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${COLORS[f.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-bold mb-4">
              Nasıl Çalışır?
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">
              3 adımda biletin hazır
            </h2>
            <p className="text-base text-slate-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
              Kayıt olmadan da bilet alabilirsin. Tüm süreç 2 dakikadan kısa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 text-center"
                >
                  <span className="absolute top-5 right-5 text-5xl font-black tracking-tighter text-slate-100 dark:text-zinc-800 select-none">
                    {s.step}
                  </span>
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/bilet-takip"
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Mail className="w-4 h-4" /> Biletini e-postana mı gönderemedin? Bilet Takibi'ni kullan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
