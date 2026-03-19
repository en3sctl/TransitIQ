'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
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
  DialogTrigger,
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
  Car,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

const KvkkContent = memo(() => (
  <div className="space-y-4 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-none">
    <p><strong>Veri Sorumlusunun Kimliği:</strong> TransitIQ Ulaşım A.Ş. olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla tarafımızca işlenmektedir.</p>
    <p><strong>Kişisel Verilerin İşlenme Amacı:</strong> Toplanan kişisel verileriniz (Ad, Soyad, T.C. Kimlik No, İletişim bilgileri); bilet satış sözleşmesinin kurulması, sefer ve koltuk rezervasyonlarının yapılması, Ulaştırma Bakanlığı (UETDS) yasal bildirim zorunluluklarının yerine getirilmesi, ödeme işlemlerinin (Iyzico) güvenli bir şekilde gerçekleştirilmesi amaçlarıyla işlenmektedir.</p>
    <p><strong>Kişisel Verilerin Aktarılması:</strong> Söz konusu kişisel verileriniz, yasal zorunluluklar kapsamında Ulaştırma ve Altyapı Bakanlığına, ödeme altyapısının sağlanması amacıyla yetkili ödeme kuruluşlarına (Iyzico) ve kanunen yetkili kamu kurumlarına aktarılabilecektir.</p>
    <p><strong>Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi:</strong> Kişisel verileriniz, web sitemiz üzerinden elektronik ortamda; &quot;Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması&quot; ve &quot;Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi&quot; hukuki sebeplerine dayanılarak otomatik yollarla toplanmaktadır.</p>
    <p><strong>İlgili Kişinin Hakları:</strong> Kanun&apos;un 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, amacına uygun kullanılıp kullanılmadığını bilme, eksikse düzeltilmesini ve şartları oluştuysa silinmesini talep etme hakkına sahipsiniz.</p>
  </div>
));
KvkkContent.displayName = "KvkkContent";

const AgreementContent = memo(() => (
  <div className="space-y-4 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-none">
    <h3 className="text-base font-bold text-slate-800 dark:text-white text-center mb-2 font-semibold">MESAFELİ SATIŞ SÖZLEŞMESİ</h3>
    <div>
      <h4 className="font-bold mb-1">MADDE 1 - TARAFLAR</h4>
      <p>İşbu sözleşme, bir tarafta web sitesi üzerinden otobüs bileti satın alan &quot;Alıcı&quot; ile diğer tarafta biletleme ve aracılık hizmetini sunan TransitIQ Ulaşım Teknolojileri A.Ş. (&quot;Satıcı&quot;) arasında elektronik ortamda onaylandığı tarih itibarıyla akdedilmiştir. Alıcı, sisteme girmiş olduğu iletişim ve fatura bilgilerinin doğruluğunu beyan ve taahhüt eder.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 2 - KONU</h4>
      <p>İşbu Sözleşme&apos;nin konusu, Alıcı&apos;nın Satıcı&apos;ya ait web sitesinden elektronik ortamda siparişini verdiği biletin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 3 - SÖZLEŞME KONUSU BİLET BİLGİLERİ</h4>
      <p>Sözleşme konusu hizmet, Alıcı tarafından seçilen kalkış ve varış noktaları arasında, belirtilen tarih ve saatte yapılacak olan tarifeli otobüs seferi taşıma biletidir. Alıcı tarafından ödenen toplam bedel, bilet üzerinde ve sipariş özetinde gösterilen tutar olup, bu bedele tüm yasal vergiler ve varsa hizmet komisyonları dahildir.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 4 - GENEL HÜKÜMLER</h4>
      <p>Yolcuların sefer saatinden en az 15 dakika önce ilgili peronda hazır bulunmaları gerekmektedir. Sefer saatinde peronda bulunmayan yolcular adına bilet hakkı yanar. Seyahat esnasında bagaj limitleri standart 30 kilogram olup, aşan kısım için taşıyıcı firmanın ek ücret politikaları geçerli olacaktır. Alıcı, taşıyıcı firmanın iç kurallarına uymakla yükümlüdür.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 5 - CAYMA HAKKI VE İPTAL KOŞULLARI</h4>
      <p>Mesafeli Sözleşmeler Yönetmeliği’nin 15/g maddesi uyarınca, belirli bir tarihte yapılması gereken yolcu taşıma hizmetlerinde tüketicinin cayma hakkı bulunmamaktadır. Sefer saatinden 24 saat öncesine kadar yapılan iptal taleplerinde bilet bedelinin tamamı iade edilir. Sefer saatine 24 saatten az kalan iptal taleplerinde ise iade yapılmaz, bilet açığa alınabilir.</p>
    </div>
  </div>
));
AgreementContent.displayName = "AgreementContent";

function CheckoutContent() {
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

  const [isIyzicoLoaded, setIsIyzicoLoaded] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

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
        setIsIyzicoLoaded(true);
        // Inject script to render inline after a small delay to let #iyzipay-checkout-form Div render
        setTimeout(() => {
          const container = document.createElement('div');
          container.innerHTML = data.checkoutFormContent;
          const scripts = container.querySelectorAll('script');
          scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            if (oldScript.src) newScript.src = oldScript.src;
            else newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
          });
        }, 300);
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
      {/* Main Content */}
      <main className="max-w-[95%] xl:max-w-[1600px] mx-auto w-full px-4 py-8 pb-40 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* Column 1: Sipariş Özeti & Trust Badges */}
        <div className="lg:col-span-3 space-y-5">
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
        </div>

        {/* Column 2: Yolcu Bilgileri, Checkboxes, Submit */}
        <div className="lg:col-span-4 space-y-6">
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
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-50" />
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

          {/* Legal Agreement Checkboxes */}
          <div className="space-y-4 mb-6">
            <Dialog open={isKvkkModalOpen} onOpenChange={setIsKvkkModalOpen}>
              <div className="flex items-start gap-3 mb-4 w-full">
                <Checkbox 
                  id="kvkk" 
                  required 
                  checked={isKvkkChecked} 
                  onCheckedChange={(checked) => setIsKvkkChecked(checked === true)} 
                  className="mt-1 flex-shrink-0 border-slate-300 dark:border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" 
                />
                <label htmlFor="kvkk" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 cursor-pointer">
                  <DialogTrigger className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline">KVKK Aydınlatma Metni</DialogTrigger>
                  <span className="inline">&apos;ni okudum, anladım ve kişisel verilerimin işlenmesine açık rıza veriyorum.</span>
                </label>
              </div>
              <DialogContent ref={kvkkRef} className="sm:max-w-4xl w-[90vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <div tabIndex={0} className="outline-none focus:outline-none h-0 w-0" aria-hidden="true" />
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">KVKK Aydınlatma Metni</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="py-4">
                  <KvkkContent />
                </div>
                <DialogFooter>
                  <Button onClick={() => { setIsKvkkChecked(true); setIsKvkkModalOpen(false); }} className="w-full bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl py-5 font-bold">Okudum, Onaylıyorum</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
              <div className="flex items-start gap-3 mb-6 w-full">
                <Checkbox 
                  id="agreement" 
                  required 
                  checked={isAgreementChecked} 
                  onCheckedChange={(checked) => setIsAgreementChecked(checked === true)} 
                  className="mt-1 flex-shrink-0 border-slate-300 dark:border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" 
                />
                <label htmlFor="agreement" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 cursor-pointer">
                  <DialogTrigger className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline">Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu</DialogTrigger>
                  <span className="inline">&apos;nu okudum ve onaylıyorum.</span>
                </label>
              </div>
              <DialogContent ref={agreementRef} className="sm:max-w-4xl w-[90vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <div tabIndex={0} className="outline-none focus:outline-none h-0 w-0" aria-hidden="true" />
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Mesafeli Satış Sözleşmesi</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="py-4">
                  <AgreementContent />
                </div>
                <DialogFooter>
                  <Button onClick={() => { setIsAgreementChecked(true); setIsAgreementModalOpen(false); }} className="w-full bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl py-5 font-bold">Okudum, Onaylıyorum</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Submit Button */}
          {!isIyzicoLoaded && (
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
                  Bilgileri Onayla ve Ödemeye Geç
                </>
              )}
            </Button>
          )}
        </div>

        {/* Column 3: Ödeme Bilgileri (Iyzico Inline) */}
        <div className="lg:col-span-5 space-y-5">
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
              {isIyzicoLoaded ? (
                <div id="iyzipay-checkout-form" className="w-full"></div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[200px] bg-slate-50/50 dark:bg-zinc-800/20">
                  <p className="text-base font-bold text-slate-700 dark:text-zinc-200">Iyzico Güvenli Ödeme Formu</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Animated Vehicle Footer */}
      <div className="fixed bottom-0 left-0 w-full h-16 bg-zinc-900 border-t-2 border-zinc-700 z-50 overflow-hidden flex items-center">
        <style>{`
          @keyframes drive { 0% { transform: translateX(-150px); } 100% { transform: translateX(100vw); } }
        `}</style>
        <div className="absolute w-full border-t-2 border-dashed border-zinc-500 top-1/2 transform -translate-y-1/2"></div>
        
        <div style={{ animation: 'drive 8s linear infinite' }} className="absolute left-0 text-yellow-500 z-10 top-1">
          <Car size={20} />
        </div>
        <div style={{ animation: 'drive 15s linear infinite' }} className="absolute left-0 text-indigo-400 z-10 bottom-1">
          <Bus size={24} />
        </div>
        <div style={{ animation: 'drive 22s linear infinite 5s' }} className="absolute left-0 text-emerald-500 z-10 bottom-0">
          <Truck size={28} />
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
