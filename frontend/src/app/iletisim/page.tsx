"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Clock, Send, Loader2, CheckCircle2, MessageSquare, Headphones, Building2, Sparkles } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import api from "@/lib/api";

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'E-posta',
    value: 'destek@transitiq.com',
    description: 'Genellikle 1 iş günü içinde yanıtlarız',
    link: 'mailto:destek@transitiq.com',
  },
  {
    icon: MessageSquare,
    title: 'Form',
    value: 'Hızlı İletişim',
    description: 'Aşağıdaki formu doldurarak yaz',
    link: null,
  },
  {
    icon: MapPin,
    title: 'Merkez',
    value: 'İstanbul, Türkiye',
    description: 'Uzaktan çalışan solo girişim',
    link: null,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success(res.data.message || 'Mesajınız iletildi');
      setDone(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mesaj gönderilemedi';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative border-b border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-transparent to-indigo-50/40 dark:from-emerald-950/20 dark:to-indigo-950/30 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 py-16 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            İletişim
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 leading-[1.05]">
            Seninle <span className="text-indigo-600 dark:text-indigo-400">konuşmak</span> bizim için önemli.
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
            Soru, öneri, şikayet veya iş birliği talebi — her mesajı okuyor, her birini yanıtlıyoruz.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {CONTACT_METHODS.map((c, i) => {
            const Icon = c.icon;
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 h-full hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">{c.title}</p>
                <p className="text-base font-black text-slate-900 dark:text-white mb-1">{c.value}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{c.description}</p>
              </motion.div>
            );
            return c.link ? <a key={c.title} href={c.link}>{content}</a> : <div key={c.title}>{content}</div>;
          })}
        </div>

        {/* Form + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Bize yaz</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Formu doldur, biz seni geri arayalım.</p>
              </div>
            </div>

            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Mesajın bize ulaştı!</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-sm mx-auto mb-5">
                  En kısa sürede dönüş yapacağız. Konfirmasyon e-postasını kontrol et.
                </p>
                <button
                  onClick={() => setDone(false)}
                  className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Başka bir mesaj gönder
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Ad Soyad</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      minLength={2}
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">E-posta</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Konu</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    minLength={3}
                    maxLength={150}
                    placeholder="Örn: Firma paketi hakkında bilgi"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Mesajın</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={6}
                    placeholder="Mesajını yaz..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                  />
                  <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">{form.message.length}/2000</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                </button>
              </form>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-indigo-600" />
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Çalışma Saatleri</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Hafta içi</span>
                  <span className="font-bold text-slate-900 dark:text-white">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Cumartesi</span>
                  <span className="font-bold text-slate-900 dark:text-white">10:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Pazar</span>
                  <span className="font-bold text-red-500">Kapalı</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-5">
              <Headphones className="w-6 h-6 mb-3 opacity-90" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Erken Aşama</p>
              <p className="text-base font-black mb-2">Geri bildirimin değerli</p>
              <p className="text-xs opacity-90 leading-relaxed">
                TransitIQ şu an erken geliştirme aşamasında. Fark ettiğin hatalar, eksiklikler veya özellik önerilerini bana yazarsan ürünü birlikte daha iyi hale getirebiliriz.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
              <Building2 className="w-5 h-5 text-indigo-600 mb-3" />
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Kurumsal Satış</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Firma paketleri için bizimle görüşmek ister misin?
              </p>
              <a
                href="mailto:satis@transitiq.com"
                className="inline-block mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                satis@transitiq.com →
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
