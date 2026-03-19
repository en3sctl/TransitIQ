'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

const KvkkContent = memo(() => (
  <div className="space-y-5 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-none">
    <h3 className="text-base font-bold text-slate-800 dark:text-white text-center mb-4">KİŞİSEL VERİLERİN KORUNMASI KANUNU KAPSAMINDA AYDINLATMA METNİ</h3>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">1. Veri Sorumlusunun Kimliği</h4>
      <p>TransitIQ Ulaşım Teknolojileri Anonim Şirketi (&quot;TransitIQ&quot; veya &quot;Şirket&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot; veya &quot;Kanun&quot;) kapsamında, veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda; hukuka ve dürüstlük kuralına uygun olarak, doğru ve gerektiğinde güncel şekilde, belirli, açık ve meşru amaçlarla, işlendikleri amaçla bağlantılı, sınırlı ve ölçülü biçimde, ilgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar muhafaza edilerek işlemekteyiz.</p>
      <p className="mt-2">Şirket Adresi: [Şirket Merkez Adresi]</p>
      <p>MERSİS No: [MERSİS Numarası]</p>
      <p>İletişim: info@transitiq.com | +90 (850) XXX XX XX</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">2. İşlenen Kişisel Veriler</h4>
      <p>Bilet satın alma sürecinde aşağıdaki kişisel verileriniz işlenmektedir:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası, doğum tarihi, cinsiyet</li>
        <li><strong>İletişim Bilgileri:</strong> E-posta adresi, cep telefonu numarası, adres bilgileri</li>
        <li><strong>Finansal Bilgiler:</strong> Ödeme işlemine ilişkin banka/kredi kartı bilgileri (kart bilgileri TransitIQ tarafından saklanmamakta olup, PCI-DSS sertifikalı ödeme kuruluşu Iyzico tarafından güvenli ortamda işlenmektedir)</li>
        <li><strong>Müşteri İşlem Bilgileri:</strong> Bilet bilgileri, sefer detayları, koltuk numarası, satın alma tarihi ve saati, sipariş numarası</li>
        <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, tarayıcı bilgileri, işlem zaman damgası, log kayıtları</li>
      </ul>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">3. Kişisel Verilerin İşlenme Amaçları</h4>
      <p>Toplanan kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Şehirlerarası otobüs bileti satış sözleşmesinin kurulması ve ifası</li>
        <li>Sefer ve koltuk rezervasyonlarının oluşturulması, yönetilmesi ve güncellenmesi</li>
        <li>4925 sayılı Karayolu Taşıma Kanunu ve Karayolu Taşıma Yönetmeliği kapsamında Ulaştırma ve Altyapı Bakanlığı&apos;na yapılması zorunlu olan UETDS (Ulaşım Elektronik Takip ve Denetim Sistemi) bildirimleri</li>
        <li>Ödeme işlemlerinin Iyzico güvenli ödeme altyapısı üzerinden gerçekleştirilmesi</li>
        <li>Fatura ve mali belgelerin düzenlenmesi, 213 sayılı Vergi Usul Kanunu kapsamındaki yasal yükümlülüklerin yerine getirilmesi</li>
        <li>Bilet iptali, değişikliği ve iade süreçlerinin yönetimi</li>
        <li>Müşteri şikâyet ve taleplerinin değerlendirilmesi, müşteri hizmetleri süreçlerinin yürütülmesi</li>
        <li>5651 sayılı İnternet Kanunu kapsamında yasal log kayıtlarının tutulması</li>
        <li>Hukuki uyuşmazlıklarda delil olarak kullanılması</li>
        <li>Düzenleyici ve denetleyici kurumlar ile resmi makamların taleplerinin karşılanması</li>
      </ul>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h4>
      <p>Kişisel verileriniz, KVKK&apos;nın 5. maddesinde belirtilen aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Bir sözleşmenin kurulması veya ifası (m.5/2-c):</strong> Bilet satış sözleşmesinin kurulması, sefer ve koltuk tahsisi, ödeme işlemlerinin gerçekleştirilmesi</li>
        <li><strong>Hukuki yükümlülüğün yerine getirilmesi (m.5/2-ç):</strong> UETDS bildirim yükümlülüğü, vergisel yükümlülükler, 5651 sayılı Kanun kapsamında log kayıtlarının tutulması</li>
        <li><strong>Meşru menfaat (m.5/2-f):</strong> Hizmet kalitesinin artırılması, hukuki süreçlerin yönetimi, dolandırıcılık ve suistimalin önlenmesi</li>
        <li><strong>Açık rıza (m.5/1):</strong> Yukarıda sayılan hukuki sebeplerin kapsamına girmeyen ve açık rızanızı gerektiren durumlarda</li>
      </ul>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">5. Kişisel Verilerin Aktarılması</h4>
      <p>Kişisel verileriniz, yukarıda belirtilen amaçlar doğrultusunda ve KVKK&apos;nın 8. ve 9. maddelerine uygun olarak aşağıdaki taraflara aktarılabilecektir:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Ulaştırma ve Altyapı Bakanlığı:</strong> UETDS yasal bildirim yükümlülüğü kapsamında yolcu manifesto bilgileri</li>
        <li><strong>Iyzico Ödeme Hizmetleri A.Ş.:</strong> Ödeme işlemlerinin güvenli bir şekilde gerçekleştirilmesi amacıyla</li>
        <li><strong>Taşıyıcı Firmalar:</strong> Seferin gerçekleştirilmesi ve yolcu manifestosunun oluşturulması amacıyla</li>
        <li><strong>Gelir İdaresi Başkanlığı / Vergi Daireleri:</strong> Faturalama ve vergisel yükümlülükler kapsamında</li>
        <li><strong>Adli ve İdari Makamlar:</strong> Yasal zorunluluklar çerçevesinde talep halinde</li>
        <li><strong>Hukuk Danışmanları ve Denetim Firmaları:</strong> Hukuki süreçler ve yasal denetim kapsamında</li>
      </ul>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">6. Kişisel Veri Toplamanın Yöntemi</h4>
      <p>Kişisel verileriniz; www.transitiq.com web sitesi üzerinden bilet satın alma sürecinde doldurduğunuz formlar aracılığıyla, elektronik ortamda, otomatik ve kısmen otomatik yollarla toplanmaktadır. Ödeme bilgileriniz doğrudan Iyzico güvenli ödeme altyapısına iletilmekte olup, TransitIQ sunucularında kart bilgisi saklanmamaktadır.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">7. Kişisel Verilerin Saklanma Süresi</h4>
      <p>Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve yasal saklama yükümlülükleri kapsamında muhafaza edilmektedir. Bilet işlem verileri 213 sayılı VUK kapsamında 5 yıl, log kayıtları 5651 sayılı Kanun kapsamında 2 yıl, UETDS kayıtları ilgili mevzuatta öngörülen süre boyunca saklanmaktadır. Saklama süresinin sona ermesiyle birlikte kişisel verileriniz, Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik hükümlerine uygun olarak imha edilmektedir.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">8. İlgili Kişinin Hakları</h4>
      <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
        <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
        <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
        <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
        <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
        <li>Düzeltme, silme ve yok etme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
        <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
        <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
      </ul>
      <p className="mt-3">Haklarınıza ilişkin taleplerinizi, kimliğinizi tespit edici belgeler ile birlikte <strong>kvkk@transitiq.com</strong> adresine e-posta göndererek veya noter kanalıyla şirket adresimize başvurarak iletebilirsiniz. Başvurularınız en geç 30 (otuz) gün içinde ücretsiz olarak sonuçlandırılacaktır.</p>
    </div>

    <p className="text-xs text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-200 dark:border-zinc-700">Son güncelleme: Mart 2026 | TransitIQ Ulaşım Teknolojileri A.Ş.</p>
  </div>
));
KvkkContent.displayName = "KvkkContent";

const AgreementContent = memo(() => (
  <div className="space-y-5 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-none">
    <h3 className="text-base font-bold text-slate-800 dark:text-white text-center mb-4">MESAFELİ SATIŞ SÖZLEŞMESİ VE ÖN BİLGİLENDİRME FORMU</h3>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 1 – TARAFLAR</h4>
      <p><strong>1.1. Satıcı Bilgileri:</strong></p>
      <p>Unvan: TransitIQ Ulaşım Teknolojileri Anonim Şirketi</p>
      <p>Adres: [Şirket Merkez Adresi]</p>
      <p>Telefon: +90 (850) XXX XX XX</p>
      <p>E-posta: destek@transitiq.com</p>
      <p>MERSİS No: [MERSİS Numarası]</p>
      <p className="mt-2"><strong>1.2. Alıcı Bilgileri:</strong></p>
      <p>Alıcı, web sitesi üzerinden otobüs bileti satın alan ve işbu sözleşmeyi elektronik ortamda onaylayan gerçek kişidir. Alıcı, sisteme girmiş olduğu kimlik, iletişim ve fatura bilgilerinin doğruluğunu beyan ve taahhüt eder. Yanlış veya eksik bilgi verilmesi nedeniyle doğacak tüm sorumluluk Alıcı&apos;ya aittir.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 2 – SÖZLEŞMENİN KONUSU</h4>
      <p>İşbu Sözleşme&apos;nin konusu, Alıcı&apos;nın www.transitiq.com web sitesinden elektronik ortamda siparişini verdiği şehirlerarası otobüs taşımacılığı biletinin satışı ve hizmetin ifası ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun, 29188 sayılı Mesafeli Sözleşmeler Yönetmeliği, 4925 sayılı Karayolu Taşıma Kanunu ve ilgili mevzuat hükümleri uyarınca tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 3 – SÖZLEŞME KONUSU HİZMET BİLGİLERİ</h4>
      <p><strong>3.1.</strong> Sözleşme konusu hizmet, Alıcı tarafından seçilen kalkış ve varış noktaları arasında, belirtilen tarih ve saatte gerçekleştirilecek olan tarifeli karayolu yolcu taşıma hizmetidir.</p>
      <p><strong>3.2.</strong> Alıcı tarafından ödenen toplam bedel, bilet üzerinde ve sipariş özetinde gösterilen tutar olup, bu bedele %20 KDV dahildir.</p>
      <p><strong>3.3.</strong> Bilet, dijital ortamda oluşturulmakta olup Alıcı&apos;nın belirttiği e-posta adresine ve/veya cep telefonuna elektronik olarak iletilmektedir.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 4 – ÖDEME VE TESLİMAT</h4>
      <p><strong>4.1.</strong> Bilet bedeli, Iyzico güvenli ödeme altyapısı üzerinden kredi kartı, banka kartı veya online ödeme yöntemleriyle peşin olarak ödenir.</p>
      <p><strong>4.2.</strong> Ödemenin başarıyla tamamlanmasının ardından bilet, derhal elektronik ortamda oluşturularak Alıcı&apos;nın e-posta adresine ve/veya SMS ile gönderilir.</p>
      <p><strong>4.3.</strong> Ödeme işlemi sırasında banka kaynaklı bir hata oluşması durumunda Satıcı herhangi bir sorumluluk kabul etmez.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 5 – GENEL HÜKÜMLER VE YOLCULUK KOŞULLARI</h4>
      <p><strong>5.1.</strong> Yolcuların sefer saatinden en az 30 dakika önce kalkış terminalinde hazır bulunmaları gerekmektedir.</p>
      <p><strong>5.2.</strong> Her yolcu için ücretsiz bagaj hakkı en fazla 30 kilogramdır. Bu sınırı aşan bagajlar için taşıyıcı firmanın ek ücret politikaları geçerlidir.</p>
      <p><strong>5.3.</strong> Yolcular, seyahat esnasında taşıyıcı firmanın iç kurallarına uymakla yükümlüdür. Emniyet kemeri takma zorunluluğu, sigara ve alkol yasağı başta olmak üzere tüm kurallara uyulması gerekmektedir.</p>
      <p><strong>5.4.</strong> Mücbir sebepler nedeniyle seferin iptal edilmesi halinde Satıcı, bilet bedelinin iadesini veya alternatif sefer imkânı sağlamakla yükümlüdür.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 6 – CAYMA HAKKI</h4>
      <p>29188 sayılı Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesinin (g) bendi uyarınca, belirli bir tarihte yapılması gereken yolcu taşıma hizmetlerinde cayma hakkı kullanılamaz. TransitIQ müşteri memnuniyeti politikası gereği aşağıdaki iade koşullarını uygulamaktadır.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 7 – İPTAL VE İADE KOŞULLARI</h4>
      <p><strong>7.1.</strong> Sefer saatinden 24 saat veya daha fazla süre öncesinde yapılan iptal taleplerinde bilet bedelinin tamamı, 7 iş günü içinde iade edilir.</p>
      <p><strong>7.2.</strong> Sefer saatine 24 saatten az kalan sürede yapılan iptal taleplerinde bilet bedeli iade edilmez; ancak bilet 30 gün içinde aynı güzergâhta kullanılmak üzere açığa alınabilir.</p>
      <p><strong>7.3.</strong> Sefer saati geçtikten sonra yapılan başvurularda iade veya açığa alma işlemi yapılmaz.</p>
      <p><strong>7.4.</strong> İade işlemleri, destek@transitiq.com adresine veya web sitesindeki &quot;Biletlerim&quot; sayfasından talep edilebilir.</p>
      <p><strong>7.5.</strong> Taksitli ödemelerde iade tutarı, bankanın taksit iade politikasına göre Alıcı&apos;nın hesabına yansıtılır.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 8 – SORUMLULUK VE SINIRLAMALAR</h4>
      <p><strong>8.1.</strong> TransitIQ, biletleme ve aracılık hizmeti sunmakta olup, yolcu taşıma hizmeti ilgili otobüs firması tarafından gerçekleştirilmektedir. Taşıma hizmetine ilişkin sorumluluk 4925 sayılı Karayolu Taşıma Kanunu çerçevesinde taşıyıcı firmaya aittir.</p>
      <p><strong>8.2.</strong> Web sitesinin altyapısal arızası nedeniyle geçici olarak erişilememesi durumunda TransitIQ, makul sürede erişimi yeniden sağlamakla yükümlüdür ancak dolaylı zararlardan sorumlu tutulamaz.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 9 – KİŞİSEL VERİLERİN KORUNMASI</h4>
      <p>Alıcı&apos;nın kişisel verileri, 6698 sayılı KVKK kapsamında, TransitIQ&apos;un web sitesinde yayımlanan Kişisel Verilerin Korunması Aydınlatma Metni ve Gizlilik Politikası hükümleri uyarınca işlenmekte ve korunmaktadır.</p>
    </div>

    <div>
      <h4 className="font-bold text-slate-800 dark:text-white mb-1">MADDE 10 – UYUŞMAZLIK ÇÖZÜMÜ VE YETKİLİ MAHKEME</h4>
      <p><strong>10.1.</strong> İşbu sözleşmeden doğan uyuşmazlıklarda 6502 sayılı Kanun&apos;un 68. maddesi gereğince, parasal sınırlar dâhilinde Tüketici Hakem Heyetleri, üzerindeki uyuşmazlıklarda ise Tüketici Mahkemeleri yetkilidir.</p>
      <p><strong>10.2.</strong> Alıcı, alternatif uyuşmazlık çözüm yolu olarak TÜBİS platformu üzerinden de başvuruda bulunabilir.</p>
      <p><strong>10.3.</strong> İşbu sözleşme, Alıcı tarafından elektronik ortamda onaylandığı tarihte yürürlüğe girer.</p>
    </div>

    <p className="text-xs text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-200 dark:border-zinc-700">İşbu sözleşme toplam 10 maddeden ibaret olup, Alıcı tarafından okunarak elektronik ortamda onaylanmıştır. Son güncelleme: Mart 2026</p>
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
  const [isApproved, setIsApproved] = useState(false);

  const [iyzicoScript, setIyzicoScript] = useState("");
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const handlePayment = useCallback(async () => {
    if (!canSubmit) return;
    setIsPaymentLoading(true);
    setIsApproved(true);
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
        setIyzicoScript(data.checkoutFormContent);
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

    useEffect(() => {
    if (iyzicoScript) {
      const container = document.getElementById('iyzipay-checkout-form');
      if (container) {
        container.innerHTML = ""; // Clear previous attempts
        const scriptEl = document.createRange().createContextualFragment(iyzicoScript);
        container.appendChild(scriptEl);
      }
    }
  }, [iyzicoScript]);

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
                <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <DialogTrigger className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline">KVKK Aydınlatma Metni</DialogTrigger>
                  <span className="inline">&apos;ni okudum, anladım ve kişisel verilerimin işlenmesine açık rıza veriyorum.</span>
                </span>
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
                <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <DialogTrigger className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline">Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu</DialogTrigger>
                  <span className="inline">&apos;nu okudum ve onaylıyorum.</span>
                </span>
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
            <div className="mt-8 relative h-16 w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!isApproved ? (
                  <motion.button
                    key="default"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    onClick={handlePayment}
                    disabled={!isKvkkChecked || !isAgreementChecked}
                    className="w-full h-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 shadow-md"
                  >
                    <Lock size={20} /> Bilgileri Onayla ve Ödemeye Geç
                  </motion.button>
                ) : (
                  <motion.button
                    key="approved"
                    initial={{ opacity: 0, y: -15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
                    disabled
                    className="w-full h-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 bg-emerald-600 text-white cursor-default shadow-lg shadow-emerald-500/20"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                    >
                      <CheckCircle size={24} />
                    </motion.div>
                    Bilgiler Onaylandı
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
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
              <div className="bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center">
                <div id="iyzipay-checkout-form" className="w-full overflow-hidden">
                  {/* DO NOT APPLY ANY CSS TO THIS DIV OR ITS CHILDREN */}
                </div>
                {!iyzicoScript && (
                  <div className="w-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-emerald-100 flex items-center justify-center">
                        <CreditCard className="w-9 h-9 text-indigo-500" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <Lock className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Ödeme Formu Hazır</h3>
                    <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Yolcu bilgilerinizi doldurup sözleşmeleri onayladıktan sonra ödeme formu burada açılacaktır.</p>
                    <div className="mt-8 flex items-center gap-6 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>3D Secure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-indigo-500" />
                        <span>256-bit SSL</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>

      <footer className="w-full py-6 bg-zinc-900 text-zinc-500 text-xs text-center border-t border-zinc-800">
        © 2026 TransitIQ. Tüm Hakları Saklıdır. Güvenli Ödeme Altyapısı iyzico.
      </footer>
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
