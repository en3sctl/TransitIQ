"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle2, MessageSquare, Headphones, Building2, Sparkles, AlertTriangle, Ticket, ShieldAlert } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'E-posta',
    value: 'destek@transitiq.com',
    description: 'Genellikle 1 iş günü içinde yanıtlarız',
    link: 'mailto:destek@transitiq.com',
  },
  {
    icon: Phone,
    title: 'Telefon / WhatsApp',
    value: '+48 881 730 681',
    description: 'Arama veya WhatsApp mesajı',
    link: 'https://wa.me/48881730681',
  },
  {
    icon: MapPin,
    title: 'Merkez',
    value: 'İstanbul, Türkiye',
    description: 'Uzaktan çalışan solo girişim',
    link: null,
  },
];

const COMPLAINT_CATEGORIES = [
  { value: 'DELAY', label: 'Gecikme', desc: 'Otobüs geç geldi / sefer geç hareket etti' },
  { value: 'DRIVER', label: 'Şoför', desc: 'Şoför davranışı veya sürüş sorunu' },
  { value: 'CLEANLINESS', label: 'Temizlik', desc: 'Araç hijyeni / koku / kirlilik' },
  { value: 'PAYMENT', label: 'Ödeme', desc: 'Ücret, iade veya cüzdan sorunu' },
  { value: 'SEAT', label: 'Koltuk', desc: 'Koltuk rezervasyonu / arızalı koltuk' },
  { value: 'OTHER', label: 'Diğer', desc: 'Listedeki kategorilere girmeyen konular' },
];

function ContactPageInner() {
  const { user } = useAuth();
  const params = useSearchParams();
  const initialTab = params.get('tab') === 'complaint' ? 'complaint' : 'message';
  const initialPnr = params.get('pnr') || '';

  const [tab, setTab] = useState<'message' | 'complaint'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [complaint, setComplaint] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    description: '',
    pnr: initialPnr,
  });

  // Prefill name/email when user loads
  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
      setComplaint(c => ({ ...c, name: c.name || user.name || '', email: c.email || user.email || '' }));
    }
  }, [user]);

  const handleMessage = async (e: React.FormEvent) => {
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

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.category) { toast.error('Bir kategori seç'); return; }
    setLoading(true);
    try {
      await api.post('/complaints', {
        contactName: complaint.name.trim(),
        contactEmail: complaint.email.trim().toLowerCase(),
        category: complaint.category,
        subject: complaint.subject.trim(),
        description: complaint.description.trim(),
        pnr: complaint.pnr.trim() ? complaint.pnr.trim().toUpperCase() : undefined,
      });
      toast.success('Şikayetin kaydedildi. Ekip en kısa sürede dönecek.');
      setDone(true);
      setComplaint({ name: '', email: '', category: '', subject: '', description: '', pnr: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Şikayet gönderilemedi';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (next: 'message' | 'complaint') => {
    setTab(next);
    setDone(false);
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
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl mb-6 w-fit">
              <button
                onClick={() => switchTab('message')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'message' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Mesaj / Soru
              </button>
              <button
                onClick={() => switchTab('complaint')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'complaint' ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'}`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Şikayet Bildir
              </button>
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
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                  {tab === 'complaint' ? 'Şikayetin bize ulaştı!' : 'Mesajın bize ulaştı!'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-sm mx-auto mb-5">
                  {tab === 'complaint'
                    ? 'Ekip şikayetini inceleyecek. Gelişmeleri e-postadan takip edebilirsin.'
                    : 'En kısa sürede dönüş yapacağız. Konfirmasyon e-postasını kontrol et.'}
                </p>
                <button
                  onClick={() => setDone(false)}
                  className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Başka bir {tab === 'complaint' ? 'şikayet' : 'mesaj'} gönder
                </button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {tab === 'message' ? (
                  <motion.form
                    key="message"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onSubmit={handleMessage}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Bize yaz</h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Genel sorular, öneri, iş birliği.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Ad Soyad</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required minLength={2} maxLength={100}
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
                        required minLength={3} maxLength={150}
                        placeholder="Örn: Firma paketi hakkında bilgi"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Mesajın</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required minLength={10} maxLength={2000} rows={6}
                        placeholder="Mesajını yaz..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                      />
                      <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">{form.message.length}/2000</p>
                    </div>

                    <button
                      type="submit" disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {loading ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="complaint"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onSubmit={handleComplaint}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Şikayet bildir</h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Yaşadığın sorunu detaylıca anlat, ekibimiz takibe alsın.</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/80 dark:border-amber-500/20 p-3 flex gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                        Şikayetin kayıt altına alınır ve üzerinde iz bırakır. PNR numaran varsa biletle eşleştirir, çözüm sürecini hızlandırırız.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Ad Soyad</label>
                        <input
                          value={complaint.name}
                          onChange={(e) => setComplaint({ ...complaint, name: e.target.value })}
                          required minLength={2} maxLength={100}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">E-posta</label>
                        <input
                          type="email"
                          value={complaint.email}
                          onChange={(e) => setComplaint({ ...complaint, email: e.target.value })}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2 block">Kategori</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {COMPLAINT_CATEGORIES.map(cat => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setComplaint({ ...complaint, category: cat.value })}
                            className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                              complaint.category === cat.value
                                ? 'border-red-500 bg-red-50 dark:bg-red-500/10 ring-2 ring-red-500/20'
                                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <p className={`text-xs font-black ${complaint.category === cat.value ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{cat.label}</p>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5 leading-tight">{cat.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Konu</label>
                        <input
                          value={complaint.subject}
                          onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })}
                          required minLength={3} maxLength={200}
                          placeholder="Örn: Otobüs 45 dakika geç geldi"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block flex items-center gap-1.5">
                          <Ticket className="w-3 h-3" /> PNR <span className="text-slate-400 normal-case tracking-normal">(opsiyonel)</span>
                        </label>
                        <input
                          value={complaint.pnr}
                          onChange={(e) => setComplaint({ ...complaint, pnr: e.target.value.toUpperCase() })}
                          maxLength={20}
                          placeholder="ABC1234"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold tracking-wider focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Detaylı açıklama</label>
                      <textarea
                        value={complaint.description}
                        onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
                        required minLength={10} maxLength={5000} rows={7}
                        placeholder="Ne yaşadın? Ne zaman oldu? Hangi personel / araç söz konusuydu? Beklentin nedir?"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none"
                      />
                      <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">{complaint.description.length}/5000</p>
                    </div>

                    <button
                      type="submit" disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                      {loading ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
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
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Hızlı İletişim</p>
              <p className="text-base font-black mb-2">WhatsApp ile yaz</p>
              <p className="text-xs opacity-90 mb-3 leading-relaxed">
                Acil konularda veya hızlı sorular için WhatsApp üzerinden ulaşabilirsin:
              </p>
              <a
                href="https://wa.me/48881730681"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur border border-white/20 rounded-lg px-3 py-2 text-xs font-bold hover:bg-white/25 transition-colors"
              >
                <Phone className="w-3 h-3" /> +48 881 730 681
              </a>
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

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-zinc-950" />}>
      <ContactPageInner />
    </Suspense>
  );
}
