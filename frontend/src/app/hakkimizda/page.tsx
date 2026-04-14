"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Target, Eye, Heart, TrendingUp, Users, Shield, Zap, Globe, ArrowRight } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";

const VALUES = [
  {
    icon: Shield,
    title: 'Güvenilirlik',
    text: 'Yolcu verilerini KVKK kapsamında şifreleyerek koruruz. Ödeme altyapısı PCI-DSS sertifikalı Iyzico ile güvence altında.',
  },
  {
    icon: Zap,
    title: 'Hız ve Otomasyon',
    text: 'Ödeme onayından PNR üretimine, PDF bilet gönderiminden SMS hatırlatmasına kadar her şey saniyeler içinde, otomatik.',
  },
  {
    icon: Heart,
    title: 'Şeffaflık',
    text: 'Gizli komisyon yok, sürpriz fatura yok. Tüm maliyetler net, paketler açık, müşteri memnuniyeti her şeyden önce gelir.',
  },
  {
    icon: Globe,
    title: 'Türkiye Odaklı',
    text: 'Türkçe arayüz, Türk şirket mevzuatına uygun fatura, yerel ödeme sağlayıcıları. Her detay Türkiye için tasarlandı.',
  },
];

const MILESTONES = [
  { year: '2024', title: 'Kuruluş', text: 'Ankara\'da 3 kişilik ekiple yola çıktık.' },
  { year: '2025', title: 'Erken Erişim', text: '5 pilot firma ile MVP\'yi sahaya aldık.' },
  { year: '2026', title: 'Ticari Lansman', text: 'Tam özellikli platform yayında, 12 ilde hizmet.' },
  { year: '2027', title: 'Hedef', text: 'Türkiye genelinde 500+ firma, mobil uygulama.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative border-b border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-emerald-50/40 dark:from-indigo-950/30 dark:to-emerald-950/20 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 py-20 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Hakkımızda
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-[1.05]">
            Yolculuk teknolojisinde<br />
            <span className="text-indigo-600 dark:text-indigo-400">Türkiye&apos;nin sesi olmak için varız.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-zinc-400 font-medium max-w-3xl leading-relaxed">
            TransitIQ, şehirlerarası otobüs taşımacılığını 21. yüzyıla taşıyan, yapay zeka destekli bir bilet ve filo yönetim platformudur.
            Milyonlarca yolcunun her gün hakkı olan şeffaflık, güvenlik ve konforu dijitalleştiriyoruz.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '150+', label: 'Aktif Rota' },
            { num: '12', label: 'Hizmet İli' },
            { num: '25K+', label: 'Mutlu Yolcu' },
            { num: '%99.9', label: 'Uptime' },
          ].map(({ num, label }) => (
            <div key={label} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">{num}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission + Vision */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-5">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Misyonumuz</h2>
            <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
              Şehirlerarası otobüs taşımacılığında dijitalleşme uçurumunu kapatıp, hem firmaların hem yolcuların
              hayatını kolaylaştıran, adil, şeffaf ve akıllı bir ekosistem kurmak.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5">
              <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Vizyonumuz</h2>
            <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
              Türkiye&apos;nin her ilinden her noktasına, her otobüsünü TransitIQ altyapısından geçiren;
              bölgenin en güvenilir yolculuk teknoloji platformu olmak.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Değerlerimiz</h2>
          <p className="text-base text-slate-500 dark:text-zinc-400 font-medium">Her kararımızı yönlendiren temel ilkeler.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 flex gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white mb-1">{v.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">{v.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Yolculuğumuz</h2>
          <p className="text-base text-slate-500 dark:text-zinc-400 font-medium">Kısa ama dolu bir hikaye.</p>
        </div>
        <div className="relative pl-10 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-8">
          {MILESTONES.map((m, i) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="absolute -left-[45px] top-1 w-6 h-6 rounded-full bg-indigo-600 border-4 border-slate-50 dark:border-zinc-950 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{m.year}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{m.title}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">{m.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-5" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">
            Ekosistemimize katıl
          </h2>
          <p className="text-base text-slate-600 dark:text-zinc-400 font-medium mb-6 max-w-2xl mx-auto">
            Yolcu olarak biletini al, firma olarak filonu yönet, geliştirici olarak API&apos;mize erişim sağla.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold text-sm">
              Bilet Ara <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/fiyatlandirma" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
              Firma Paketleri
            </Link>
            <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800">
              İletişim
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
