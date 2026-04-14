"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Zap, Rocket, Building2, ArrowRight, Phone, Headphones, Shield, Database, BarChart3, Users } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";

const TIERS = [
  {
    id: 'starter',
    name: 'Başlangıç',
    description: 'Küçük firmalar için hızlı başlangıç',
    price: '4.990',
    period: 'ay',
    icon: Zap,
    accent: 'slate',
    features: [
      { text: 'Tek firma yönetimi', included: true },
      { text: 'Sınırsız yolcu', included: true },
      { text: '10 araç kapasitesi', included: true },
      { text: '2 operatör kullanıcı', included: true },
      { text: 'E-bilet + PDF', included: true },
      { text: 'Iyzico ödeme entegrasyonu', included: true },
      { text: 'Temel e-posta bildirimleri', included: true },
      { text: 'SMS bildirim sistemi', included: false },
      { text: 'Canlı sefer takibi', included: false },
      { text: 'Gelişmiş raporlar', included: false },
    ],
    cta: 'Ücretsiz Dene',
  },
  {
    id: 'pro',
    name: 'Profesyonel',
    description: 'Büyüyen firmalar için tam özellik',
    price: '12.990',
    period: 'ay',
    icon: Rocket,
    accent: 'indigo',
    popular: true,
    features: [
      { text: 'Çoklu şube yönetimi', included: true },
      { text: 'Sınırsız yolcu', included: true },
      { text: '50 araç kapasitesi', included: true },
      { text: '10 operatör kullanıcı', included: true },
      { text: 'E-bilet + PDF', included: true },
      { text: 'Iyzico ödeme entegrasyonu', included: true },
      { text: 'Netgsm SMS entegrasyonu', included: true },
      { text: 'Canlı sefer takibi (GPS)', included: true },
      { text: 'Gelişmiş raporlar + Excel export', included: true },
      { text: 'Öncelikli destek', included: true },
    ],
    cta: 'Demo Talep Et',
  },
  {
    id: 'enterprise',
    name: 'Kurumsal',
    description: 'Ulusal ağlar için özel çözüm',
    price: 'Özel',
    period: '',
    icon: Building2,
    accent: 'purple',
    features: [
      { text: 'Sınırsız şube ve araç', included: true },
      { text: 'Beyaz etiket (white-label)', included: true },
      { text: 'Özel domain + marka', included: true },
      { text: 'API erişimi', included: true },
      { text: 'Sınırsız operatör', included: true },
      { text: 'Özel AI fiyatlandırma', included: true },
      { text: 'SLA garantisi (%99.9)', included: true },
      { text: '7/24 teknik destek', included: true },
      { text: 'Özel entegrasyonlar', included: true },
      { text: 'Yerinde eğitim', included: true },
    ],
    cta: 'Görüşme Ayarla',
  },
];

const FAQ = [
  {
    q: 'TransitIQ kimin için?',
    a: 'Şehirlerarası otobüs bileti satan yolcu taşımacılığı firmaları için geliştirilmiş bir SaaS platformudur. Küçük filodan ulusal ağlara kadar her ölçeğe uygundur.',
  },
  {
    q: '14 gün ücretsiz deneme nasıl çalışıyor?',
    a: 'Başlangıç ve Profesyonel planlarında kart bilgisi alınmadan 14 gün tam özellikli deneme sunuyoruz. Memnun kalırsan ödemeyi başlat, kalmazsan hesabın kapanır.',
  },
  {
    q: 'Komisyon alıyor musunuz?',
    a: 'Hayır. Platform ücreti dışında bilet başına komisyon almıyoruz. Tek maliyet Iyzico ödeme komisyonudur (onu siz belirliyorsunuz).',
  },
  {
    q: 'Mevcut sistemimden geçiş zor mu?',
    a: 'Kurumsal pakette teknik ekibimiz mevcut veritabanınızı import ederek geçişi yönetiyor. Profesyonel pakette CSV/Excel import aracı sunuyoruz.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative border-b border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-20 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Firmalar İçin SaaS Paketler
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mb-5 leading-[1.05]">
            Filon için en iyi<br />
            <span className="text-indigo-600 dark:text-indigo-400">bilet yönetim sistemi</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
            Teknoloji yatırımını biz yaptık. Sen sadece araçlarını yönet, biletlerini sat. 14 gün ücretsiz dene.
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            const accentClasses: Record<string, { ring: string; bg: string; text: string; badge: string }> = {
              slate: { ring: 'border-slate-200 dark:border-zinc-800', bg: 'bg-slate-100 dark:bg-zinc-800', text: 'text-slate-600 dark:text-zinc-400', badge: 'bg-slate-100 dark:bg-zinc-800 text-slate-600' },
              indigo: { ring: 'border-indigo-500 ring-4 ring-indigo-500/10', bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-600 text-white' },
              purple: { ring: 'border-purple-200 dark:border-purple-800', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' },
            };
            const a = accentClasses[tier.accent];
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white dark:bg-zinc-900 rounded-3xl p-8 border-2 ${a.ring} ${tier.popular ? 'shadow-xl scale-[1.02]' : 'shadow-sm'}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    En Popüler
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl ${a.bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${a.text}`} />
                </div>

                <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-1">{tier.name}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6">{tier.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {tier.price !== 'Özel' && <span className="text-lg font-bold text-slate-500">₺</span>}
                    <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{tier.price}</span>
                    {tier.period && <span className="text-sm font-bold text-slate-500 ml-1">/{tier.period}</span>}
                  </div>
                  {tier.price !== 'Özel' && (
                    <p className="text-xs text-slate-400 font-semibold mt-1">+ KDV, yıllık ödemede %15 indirim</p>
                  )}
                </div>

                <Link
                  href="/iletisim"
                  className={`block w-full text-center px-5 py-3 rounded-xl font-bold text-sm mb-6 transition-all ${
                    tier.popular
                      ? 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-black dark:hover:bg-white'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tier.cta}
                </Link>

                <ul className="space-y-3">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      {f.included ? (
                        <div className={`w-5 h-5 rounded-full ${a.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Check className={`w-3 h-3 ${a.text}`} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                      <span className={f.included ? 'text-slate-700 dark:text-zinc-300 font-medium' : 'text-slate-400 dark:text-zinc-500 font-medium line-through'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Her pakette bulunan temeller</h2>
          <p className="text-base text-slate-500 dark:text-zinc-400 font-medium">En küçük paketten en büyüğe, sektör standardı altyapı.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield, label: 'SSL + KVKK Uyumlu', desc: 'Yolcu verileri şifreli' },
            { icon: Database, label: 'Günlük Yedekleme', desc: 'Veri kaybı olmaz' },
            { icon: BarChart3, label: 'Gerçek Zamanlı Dashboard', desc: 'Anlık satış verileri' },
            { icon: Users, label: 'Rol Bazlı Erişim', desc: 'Admin, operatör, sürücü' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
              <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-3" />
              <p className="text-sm font-black text-slate-900 dark:text-white mb-1">{label}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Sık Sorulan Sorular</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details key={i} className="group bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl px-5 py-4 cursor-pointer">
              <summary className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white list-none">
                {f.q}
                <ArrowRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <Headphones className="w-10 h-10 text-white mx-auto mb-5 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-3">Demo görüşmesi ayarlayalım</h2>
          <p className="text-indigo-100 font-medium mb-6 max-w-lg mx-auto">
            Satış ekibimiz filon ve ihtiyaçlarını dinleyip sana özel bir paket hazırlar. 30 dakika sürer.
          </p>
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Phone className="w-4 h-4" /> Görüşme Talep Et
          </Link>
        </div>
      </section>
    </div>
  );
}
