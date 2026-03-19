'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Bus,
  Calendar,
  Clock,
  Lock,
  ShieldCheck,
  LifeBuoy,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Armchair,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tripId = searchParams.get('tripId') || '';
  const seat = searchParams.get('seat') || '';
  const price = searchParams.get('price') || '0';
  const origin = searchParams.get('origin') || 'İstanbul';
  const destination = searchParams.get('destination') || 'Ankara';
  const dateStr = searchParams.get('date') || '';
  const departureTime = searchParams.get('departureTime') || '';
  const arrivalTime = searchParams.get('arrivalTime') || '';
  const busType = searchParams.get('busType') || '';

  const [form, setForm] = useState({
    tcKimlik: '',
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [isKvkkChecked, setIsKvkkChecked] = useState(false);
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const [isKvkkModalOpen, setIsKvkkModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const kvkkRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const canSubmit = isKvkkChecked && isAgreementChecked;

  const [iyzicoHtml, setIyzicoHtml] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Execute Iyzico scripts after injecting HTML
  useEffect(() => {
    if (iyzicoHtml) {
      const container = document.getElementById('iyzico-form-container');
      if (container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach((oldScript) => {
          const newScript = document.createElement('script');
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      }
    }
  }, [iyzicoHtml]);

  const handlePayment = useCallback(async () => {
    if (!canSubmit) return;
    setIsPaymentLoading(true);
    try {
      const res = await fetch('http://localhost:3000/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: price,
          buyerName: form.ad,
          buyerSurname: form.soyad,
          buyerTc: form.tcKimlik,
          buyerEmail: form.email,
          buyerPhone: form.telefon,
        }),
      });
      const data = await res.json();
      if (data.checkoutFormContent) {
        setIyzicoHtml(data.checkoutFormContent);
      } else {
        console.error('Iyzico error:', data);
        alert('Ödeme formu yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      console.error('Payment init error:', err);
      alert('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsPaymentLoading(false);
    }
  }, [canSubmit, price, form]);

  // Scroll modals to top when opened
  useEffect(() => {
    if (isKvkkModalOpen && kvkkRef.current) {
      kvkkRef.current.scrollTop = 0;
    }
  }, [isKvkkModalOpen]);

  useEffect(() => {
    if (isAgreementModalOpen && agreementRef.current) {
      agreementRef.current.scrollTop = 0;
    }
  }, [isAgreementModalOpen]);

  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '23 Mart 2026';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Koltuk Seçimine Geri Dön</span>
          </button>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Güvenli Ödeme</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
              256-bit SSL ile Şifrelenmektedir
            </p>
          </div>
          <div>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="max-w-7xl mx-auto px-4 pt-6 flex items-center justify-center gap-4 text-xs font-bold text-slate-400 dark:text-zinc-500">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold">1</span>
          <span>Sefer Seçimi</span>
        </div>
        <div className="w-8 h-px bg-emerald-300 dark:bg-emerald-800" />
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold">2</span>
          <span>Koltuk Seçimi</span>
        </div>
        <div className="w-8 h-px bg-emerald-300 dark:bg-emerald-800" />
        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 font-semibold">3</span>
          <span>Ödeme</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Side — Forms (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section A: Yolcu Bilgileri */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Yolcu Bilgileri</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Bilet için gerekli kişisel bilgileriniz</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* TC Kimlik */}
              <div className="space-y-2">
                <Label htmlFor="tcKimlik" className="text-sm font-bold text-slate-700 dark:text-zinc-300">T.C. Kimlik No</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <Input
                    id="tcKimlik"
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="12345678901"
                    value={form.tcKimlik}
                    onChange={(e) => handleChange('tcKimlik', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Ad + Soyad row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ad" className="text-sm font-bold text-slate-700 dark:text-zinc-300">Ad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="ad"
                      type="text"
                      placeholder="Adınız"
                      value={form.ad}
                      onChange={(e) => handleChange('ad', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soyad" className="text-sm font-bold text-slate-700 dark:text-zinc-300">Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="soyad"
                      type="text"
                      placeholder="Soyadınız"
                      value={form.soyad}
                      onChange={(e) => handleChange('soyad', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email + Telefon row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-zinc-300">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefon" className="text-sm font-bold text-slate-700 dark:text-zinc-300">Cep Telefonu</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="telefon"
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={form.telefon}
                      onChange={(e) => handleChange('telefon', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Ödeme Bilgileri */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Ödeme Bilgileri</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Güvenli ödeme altyapısı Iyzico tarafından sağlanmaktadır</p>
              </div>
            </div>

            <div className="p-6">
              {iyzicoHtml ? (
                <div
                  id="iyzico-form-container"
                  dangerouslySetInnerHTML={{ __html: iyzicoHtml }}
                />
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[200px] bg-slate-50/50 dark:bg-zinc-800/20">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950/30 dark:to-emerald-950/30">
                    <CreditCard className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-700 dark:text-zinc-200">{isPaymentLoading ? 'Iyzico ödeme formu yükleniyor...' : 'Iyzico Güvenli Ödeme Formu'}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1">{isPaymentLoading ? 'Lütfen bekleyiniz...' : 'Formu doldurup sözleşmeleri onaylandıktan sonra ödeme başlatılabilir'}</p>
                  </div>
                  {!isPaymentLoading && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400">VISA</div>
                      <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400">Mastercard</div>
                      <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400">Troy</div>
                    </div>
                  )}
                  {isPaymentLoading && (
                    <div className="mt-2">
                      <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Legal Agreement Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="kvkk"
                checked={isKvkkChecked}
                onCheckedChange={(checked) => setIsKvkkChecked(checked === true)}
                className="mt-1 border-slate-300 dark:border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <Label htmlFor="kvkk" className="text-sm font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed cursor-pointer">
                <button type="button" onClick={(e) => { e.preventDefault(); setIsKvkkModalOpen(true); }} className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">KVKK Aydınlatma Metni</button>&apos;ni okudum, anladım ve kişisel verilerimin işlenmesine açık rıza veriyorum.
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="agreement"
                checked={isAgreementChecked}
                onCheckedChange={(checked) => setIsAgreementChecked(checked === true)}
                className="mt-1 border-slate-300 dark:border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <Label htmlFor="agreement" className="text-sm font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed cursor-pointer">
                <button type="button" onClick={(e) => { e.preventDefault(); setIsAgreementModalOpen(true); }} className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu</button>&apos;nu okudum ve onaylıyorum.
              </Label>
            </div>
          </div>

          {/* KVKK Modal */}
          <Dialog open={isKvkkModalOpen} onOpenChange={setIsKvkkModalOpen}>
            <DialogContent ref={kvkkRef} className="sm:max-w-4xl w-[90vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
              <div tabIndex={0} className="outline-none focus:outline-none h-0 w-0" aria-hidden="true" />
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">KVKK Aydınlatma Metni</DialogTitle>
                </div>
                <DialogDescription className="text-sm text-slate-500 dark:text-zinc-400">6698 Sayılı Kişisel Verilerin Korunması Kanunu kapsamında hazırlanmış aydınlatma metni</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">

                <p>TransitIQ Ulaşım Teknolojileri Anonim Şirketi (&quot;TransitIQ&quot; veya &quot;Şirket&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz. Bu doğrultuda, KVKK&apos;nın 10. maddesi gereğince aydınlatma yükümlülüğümüzü yerine getirmek amacıyla işbu Aydınlatma Metni hazırlanmıştır.</p>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">1. Veri Sorumlusunun Kimliği</h3>
                  <p>Kişisel verileriniz, veri sorumlusu sıfatıyla TransitIQ Ulaşım Teknolojileri A.Ş. tarafından aşağıda açıklanan amaçlar doğrultusunda işlenebilecektir.</p>
                  <p className="mt-2"><strong>Unvan:</strong> TransitIQ Ulaşım Teknolojileri Anonim Şirketi</p>
                  <p><strong>Adres:</strong> Büyükdere Caddesi No: 185, Levent, Beşiktaş, İstanbul, Türkiye</p>
                  <p><strong>Mersis No:</strong> 0123456789012345</p>
                  <p><strong>E-posta:</strong> kvkk@transitiq.com.tr</p>
                  <p><strong>Telefon:</strong> +90 (212) 555 00 00</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">2. Kişisel Verilerin İşlenme Amacı</h3>
                  <p>Toplanan kişisel verileriniz aşağıdaki amaçlarla KVKK&apos;nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları dahilinde işlenebilecektir:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Otobüs bileti satışına ilişkin sözleşmesel yükümlülüklerin yerine getirilmesi</li>
                    <li>Yolcu kimlik bilgilerinin doğrulanması ve yasal yükümlülüklerin yerine getirilmesi</li>
                    <li>Ödeme işlemlerinin gerçekleştirilmesi ve mali kayıtların tutulması</li>
                    <li>Müşteri hizmetleri ve destek taleplerinin yönetimi</li>
                    <li>E-bilet ve sefer bilgilerinin iletilmesi (e-posta, SMS)</li>
                    <li>İptal, iade ve değişiklik işlemlerinin yürütülmesi</li>
                    <li>Yasal düzenleme ve mevzuattan kaynaklanan yükümlülüklerin ifası</li>
                    <li>Hizmet kalitesinin artırılması, analiz ve istatistik çalışmaları</li>
                    <li>Bilgi güvenliği süreçlerinin yürütülmesi ve saht. erişim denetimi</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">3. İşlenen Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği</h3>
                  <p>Toplanan kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda aşağıdaki kişi ve kurumlara aktarılabilecektir:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Ödeme Kuruluşları:</strong> Iyzico Ödeme Hizmetleri A.Ş. — ödeme işlemlerinin güvenli şekilde gerçekleştirilmesi amacıyla</li>
                    <li><strong>Taşımacılık Şirketleri:</strong> Bilet satışı yapılan taşımacılık firmasına, seferin gerçekleştirilmesi amacıyla</li>
                    <li><strong>Kamu Kurum ve Kuruluşları:</strong> EPDK, Ulaştırma ve Altyapı Bakanlığı, Emniyet Genel Müdürlüğü ve diğer yetkili makamlar — yasal zorunluluklar gereği</li>
                    <li><strong>Hukuk Danışmanları:</strong> Hukuki süreçlerin takibi ve yürütülmesi amacıyla</li>
                    <li><strong>Teknoloji Sağlayıcıları:</strong> Sunucu, bulut hizmet sağlayıcıları — verilerin güvenli şekilde saklanması amacıyla</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h3>
                  <p>Kişisel verileriniz, web sitemiz üzerindeki bilet satın alma formları aracılığıyla elektronik ortamda toplanmaktadır. Bu veriler:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>KVKK md. 5/2(c) — Bir sözleşmenin kurulması veya ifası için zorunlu olması</li>
                    <li>KVKK md. 5/2(e) — Bir hakkın tesisi, kullanılması veya korunması için zorunlu olması</li>
                    <li>KVKK md. 5/2(ç) — Kanunlarda açıkça öngörülmesi</li>
                    <li>KVKK md. 5/1 — Açık rıza (pazarlama faaliyetleri için)</li>
                  </ul>
                  <p className="mt-2">hukuki sebeplerine dayanarak işlenmektedir.</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">5. İlgili Kişinin Hakları (KVKK Madde 11)</h3>
                  <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                    <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                    <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                    <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
                    <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                    <li>KVKK md. 7 çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme</li>
                    <li>Düzeltme, silme ve yok etme işlemlerinin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                    <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
                    <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
                  </ul>
                  <p className="mt-3">Haklarınıza ilişkin taleplerinizi, <strong>kvkk@transitiq.com.tr</strong> adresine veya şirket merkezimize yazılı olarak iletebilirsiniz. Talepleriniz, niteliğine göre en kısa sürede ve en geç otuz (30) gün içinde ücretsiz olarak sonuçlandırılacaktır.</p>
                </div>

                <div className="border-t border-slate-200 dark:border-zinc-700 pt-4">
                  <p className="text-xs text-slate-400 dark:text-zinc-500">İşbu aydınlatma metni, 6698 sayılı KVKK&apos;nın 10. maddesi ile Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ hükümlerine uygun olarak hazırlanmıştır. Son güncelleme: 19 Mart 2026.</p>
                </div>

              </div>
              <DialogFooter>
                <Button
                  onClick={() => { setIsKvkkChecked(true); setIsKvkkModalOpen(false); }}
                  className="w-full bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl py-5 font-bold"
                >
                  Okudum, Onaylıyorum
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Agreement Modal */}
          <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
            <DialogContent ref={agreementRef} className="sm:max-w-4xl w-[90vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
              <div tabIndex={0} className="outline-none focus:outline-none h-0 w-0" aria-hidden="true" />
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu</DialogTitle>
                </div>
                <DialogDescription className="text-sm text-slate-500 dark:text-zinc-400">6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında düzenlenen sözleşme</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">MADDE 1 – TARAFLAR</h3>
                  <p><strong>1.1. Satıcı Bilgileri:</strong></p>
                  <p>Unvan: TransitIQ Ulaşım Teknolojileri Anonim Şirketi</p>
                  <p>Adres: Büyükdere Caddesi No: 185, Levent, Beşiktaş, İstanbul, Türkiye</p>
                  <p>Telefon: +90 (212) 555 00 00</p>
                  <p>E-posta: destek@transitiq.com.tr</p>
                  <p>Mersis No: 0123456789012345</p>
                  <p className="mt-2"><strong>1.2. Alıcı Bilgileri:</strong></p>
                  <p>Ödeme sayfasındaki formda kişisel bilgilerini beyan eden ve online bilet satın alma işlemini gerçekleştiren gerçek kişi (&quot;Yolcu&quot; veya &quot;Alıcı&quot;).</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">MADDE 2 – KONU</h3>
                  <p>İşbu sözleşme, Alıcı&apos;nın Satıcı&apos;ya ait <strong>www.transitiq.com.tr</strong> internet sitesi üzerinden elektronik ortamda siparişini verdiği, sözleşmede bahsi geçen nitelikleri haiz otobüs bileti hizmetinin satışı ve ifasına ilişkin olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenlemeyi amaçlamaktadır.</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">MADDE 3 – SÖZLEŞME KONUSU HİZMET/BİLET BİLGİLERİ</h3>
                  <p><strong>3.1.</strong> Hizmetin temel özellikleri (güzergah, kalkış/varış noktaları, tarih, saat, koltuk numarası, otobüs tipi ve bilet ücreti) sipariş özeti bölümünde açıkça belirtilmiştir.</p>
                  <p><strong>3.2.</strong> Listelenen fiyatlara KDV dahildir. Herhangi bir ek ücret, servis bedeli veya sigorta bedeli bilet fiyatına dahil olup, toplam tutar sipariş özetinde gösterilmektedir.</p>
                  <p><strong>3.3.</strong> Alıcı tarafından onaylanan bilet bilgilerinin doğruluğu Alıcı&apos;nın sorumluluğundadır.</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">MADDE 4 – GENEL HÜKÜMLER</h3>
                  <p><strong>4.1.</strong> Alıcı, satışa konu hizmetin temel nitelikleri, satış fiyatı ve ödeme şekli ile ifaya ilişkin bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul, beyan ve taahhüt eder.</p>
                  <p><strong>4.2.</strong> Satıcı, hizmetin sipariş tarihinden itibaren sözleşmede belirtilen süre içinde ifasını taahhüt eder. Sefer iptallerinde Alıcı, bilet bedelinin tamamının iadesini talep etme hakkına sahiptir.</p>
                  <p><strong>4.3.</strong> Alıcı, ödemeyi kredi kartı veya banka kartı ile Iyzico güvenli ödeme altyapısı üzerinden gerçekleştirmektedir. Tüm kart bilgileri 256-bit SSL şifreleme ile korunmakta olup, Satıcı tarafından saklanmamaktadır.</p>
                  <p><strong>4.4.</strong> Alıcı, belirttiği e-posta adresine ve/veya cep telefonuna gönderilecek e-bilet ve sefer bilgilendirme mesajlarını kabul eder.</p>
                  <p><strong>4.5.</strong> İşbu sözleşme, Alıcı tarafından elektronik ortamda onaylanmasıyla yürürlüğe girer. Sözleşme metni, Alıcı&apos;nın kayıtlı e-posta adresine gönderilir.</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">MADDE 5 – İPTAL VE İADE KOŞULLARI</h3>
                  <p><strong>5.1.</strong> Alıcı, seferin kalkış saatinden en az <strong>24 saat önce</strong> iptal talebinde bulunması halinde, bilet bedelinin <strong>%100&apos;ü</strong> iade edilir.</p>
                  <p><strong>5.2.</strong> Seferin kalkış saatinden <strong>24 ila 6 saat önce</strong> yapılan iptallerde, bilet bedelinin <strong>%80&apos;i</strong> iade edilir, <strong>%20&apos;si</strong> cezai kesinti olarak uygulanır.</p>
                  <p><strong>5.3.</strong> Seferin kalkış saatinden <strong>6 saatten az</strong> bir süre kala yapılan iptallerde iade yapılmaz.</p>
                  <p><strong>5.4.</strong> Satıcı tarafından yapılan sefer iptallerinde bilet bedelinin tamamı 7 iş günü içinde Alıcı&apos;nın ödeme yaptığı araca iade edilir.</p>
                  <p><strong>5.5.</strong> Tarih ve saat değişikliği talepleri, kalkış saatinden en az 12 saat önce yapılmalıdır ve müsait sefer bulunması şartına bağlıdır.</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">MADDE 6 – CAYMA HAKKI</h3>
                  <p><strong>6.1.</strong> Alıcı, 6502 sayılı Kanun&apos;un 48. maddesi ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, hizmetin ifasına başlanmadığı sürece 14 (on dört) gün içinde cayma hakkını kullanabilir.</p>
                  <p><strong>6.2.</strong> Cayma hakkının kullanılması halinde bilet bedeli, cayma bildiriminin Satıcı&apos;ya ulaştığı tarihten itibaren 14 gün içinde Alıcı&apos;ya iade edilir.</p>
                  <p><strong>6.3.</strong> Hizmetin ifasına başlanması (yolcunun otobüse binmesi), cayma hakkının sona ermesi anlamına gelir.</p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">MADDE 7 – UYUŞMAZLIK ÇÖZÜMÜ</h3>
                  <p>İşbu sözleşmeden doğan uyuşmazlıklarda, Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Parasal sınırlar için yürürlükteki mevzuat hükümleri uygulanır.</p>
                </div>

                <div className="border-t border-slate-200 dark:border-zinc-700 pt-4">
                  <p className="text-xs text-slate-400 dark:text-zinc-500">İşbu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve 27.11.2014 tarihli Mesafeli Sözleşmeler Yönetmeliği hükümlerine uygun olarak hazırlanmıştır. Sözleşme tarihi: 19 Mart 2026.</p>
                </div>

              </div>
              <DialogFooter>
                <Button
                  onClick={() => { setIsAgreementChecked(true); setIsAgreementModalOpen(false); }}
                  className="w-full bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl py-5 font-bold"
                >
                  Okudum, Onaylıyorum
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Submit Button */}
          {!iyzicoHtml && (
            <Button
              disabled={!canSubmit || isPaymentLoading}
              onClick={handlePayment}
              className={`w-full rounded-2xl py-7 font-bold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                canSubmit && !isPaymentLoading
                  ? 'bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 hover:shadow-xl cursor-pointer'
                  : 'bg-slate-300 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isPaymentLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ödeme Formu Yükleniyor...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Güvenli Ödeme Yap
                </>
              )}
            </Button>
          )}
        </div>

        {/* Right Side — Order Summary (1 col) */}
        <div className="lg:col-span-1 space-y-5">

          {/* Sipariş Özeti Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-lg overflow-hidden transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sipariş Özeti</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Route */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Güzergah</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{origin} → {destination}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Tarih</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formattedDate}</p>
                </div>
              </div>

              {/* Departure / Arrival */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Kalkış / Varış</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{departureTime} — {arrivalTime}</p>
                </div>
              </div>

              {/* Bus Type */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Bus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Otobüs Tipi</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{busType}</p>
                </div>
              </div>

              {/* Seat */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Koltuk Numarası</p>
                  <span className="inline-block font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg text-sm">{seat}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-200 dark:border-zinc-800" />

              {/* Total Price */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800 dark:text-white">Toplam Tutar</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">₺{price}</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Güvenli İşlem
            </h3>
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>256-bit SSL Güvenli Ödeme</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>Iyzico Güvenli Ödeme Altyapısı</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <LifeBuoy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>7/24 Müşteri Hizmetleri</span>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="flex flex-col items-center justify-center py-10 animate-in fade-in-50 duration-500">
            <Bus className="w-12 h-12 mb-3 text-slate-300 dark:text-zinc-600" />
            <p className="text-3xl font-black text-zinc-950 dark:text-zinc-100 tracking-tight">TransitIQ</p>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">İyi Yolculuklar Dileriz</p>
          </div>
        </div>
      </main>
    </div>
  );
}
