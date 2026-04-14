'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
  CreditCard,
  MapPin,
  Armchair,
  FileText,
  CheckCircle,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';
import { useBookingStore } from '@/store/useBookingStore';
import { PassengerForm } from '@/components/checkout/passenger-form';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { toast } from 'sonner';

// ─── Countdown Timer Hook ───
function useCountdown(minutes: number) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft < 120;

  return { mins, secs, isUrgent, isExpired: secondsLeft <= 0 };
}

// ─── KVKK Content (memoized) ───
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
        <li>4925 sayılı Karayolu Taşıma Kanunu ve Karayolu Taşıma Yönetmeliği kapsamında Ulaştırma ve Altyapı Bakanlığı&apos;na yapılması zorunlu olan UETDS bildirimleri</li>
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

// ─── Validation ───
function validatePassengers(passengers: { tcKimlik: string; firstName: string; lastName: string }[]) {
  return passengers.every(
    (p) => p.tcKimlik.length === 11 && p.firstName.trim().length >= 2 && p.lastName.trim().length >= 2
  );
}

function validateContact(email: string, phone: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^05\d{9}$/;
  return emailRegex.test(email) && phoneRegex.test(phone.replace(/\s/g, ''));
}

// ─── Main Checkout Content ───
function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();

  // Zustand store
  const trip = useBookingStore((s) => s.trip);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const passengers = useBookingStore((s) => s.passengers);
  const contactEmail = useBookingStore((s) => s.contactEmail);
  const contactPhone = useBookingStore((s) => s.contactPhone);
  const totalPrice = useBookingStore((s) => s.totalPrice);
  const setContactEmail = useBookingStore((s) => s.setContactEmail);
  const setContactPhone = useBookingStore((s) => s.setContactPhone);
  const updatePassenger = useBookingStore((s) => s.updatePassenger);

  // Auto-fill contact and first passenger info from logged-in user
  useEffect(() => {
    if (!user || user.role !== 'PASSENGER') return;
    if (!contactEmail && user.email) setContactEmail(user.email);
    if (!contactPhone && (user as any).phoneNumber) setContactPhone((user as any).phoneNumber);
    if (passengers.length > 0 && !passengers[0].firstName && !passengers[0].lastName) {
      const parts = (user.name || '').split(' ');
      const firstName = parts.slice(0, -1).join(' ') || parts[0] || '';
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
      updatePassenger(passengers[0].seatNumber, { firstName, lastName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Local UI state
  const [isKvkkChecked, setIsKvkkChecked] = useState(false);
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const [isKvkkModalOpen, setIsKvkkModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const kvkkRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [iyzicoScript, setIyzicoScript] = useState("");
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // 10-minute seat lock countdown
  const { mins, secs, isUrgent, isExpired } = useCountdown(10);

  // Validation
  const isFormValid = validatePassengers(passengers) && validateContact(contactEmail, contactPhone);
  const canSubmit = isKvkkChecked && isAgreementChecked && isFormValid && !isExpired;

  const formatTime = (str: string) => {
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formattedDate = trip?.date
    ? new Date(trip.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // Handle empty store (direct URL access protection)
  const hasBookingData = trip && selectedSeats.length > 0;

  const seatIdMap = useBookingStore((s) => s.seatIdMap);

  const handlePayment = useCallback(async () => {
    if (!canSubmit || !trip) return;
    setIsPaymentLoading(true);

    try {
      // Seats are already locked from search page
      // Initialize Iyzico payment (with booking data for callback)
      const firstPassenger = passengers[0];
      const paymentRes = await api.post('/payment/initialize', {
        price: String(totalPrice()),
        buyerName: firstPassenger.firstName,
        buyerSurname: firstPassenger.lastName,
        buyerTc: firstPassenger.tcKimlik,
        buyerEmail: contactEmail,
        buyerPhone: contactPhone,
        tripId: trip.tripId,
        passengers: passengers.map((p) => ({
          tcKimlik: p.tcKimlik,
          firstName: p.firstName,
          lastName: p.lastName,
          seatId: seatIdMap[p.seatNumber],
        })),
      });

      if (paymentRes.data.checkoutFormContent) {
        setIsApproved(true);
        setIyzicoScript(paymentRes.data.checkoutFormContent);
      } else {
        toast.error('Ödeme formu yüklenemedi. Lütfen tekrar deneyin.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (typeof msg === 'string') {
        toast.error(msg);
      } else if (Array.isArray(msg)) {
        toast.error(msg[0]);
      } else {
        toast.error('Ödeme başlatılırken bir hata oluştu');
      }
      setIsApproved(false);
    } finally {
      setIsPaymentLoading(false);
    }
  }, [canSubmit, trip, passengers, contactEmail, contactPhone, totalPrice, selectedSeats, seatIdMap]);

  useEffect(() => {
    if (isKvkkModalOpen && kvkkRef.current) kvkkRef.current.scrollTop = 0;
  }, [isKvkkModalOpen]);

  useEffect(() => {
    if (isAgreementModalOpen && agreementRef.current) agreementRef.current.scrollTop = 0;
  }, [isAgreementModalOpen]);

  useEffect(() => {
    if (iyzicoScript) {
      const container = document.getElementById('iyzipay-checkout-form');
      if (container) {
        container.innerHTML = "";
        const scriptEl = document.createRange().createContextualFragment(iyzicoScript);
        container.appendChild(scriptEl);
      }
    }
  }, [iyzicoScript]);

  // ─── Empty state: no booking data ───
  if (!hasBookingData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Rezervasyon Bulunamadı</h1>
          <p className="text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
            Ödeme sayfasına geçmeden önce bir sefer seçip koltuk belirlemeniz gerekmektedir.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold"
          >
            Sefer Ara
          </Button>
        </motion.div>
      </div>
    );
  }

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
          <ModeToggle />
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

      {/* Seat Lock Countdown */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-sm font-bold transition-colors ${
            isExpired
              ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
              : isUrgent
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50'
          }`}
        >
          <Timer className="w-4 h-4" />
          {isExpired ? (
            <span>Rezervasyon süresi doldu. Lütfen koltuk seçimine geri dönün.</span>
          ) : (
            <span>
              Koltuklar {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} boyunca sizin için rezerve edilmiştir
            </span>
          )}
        </motion.div>
      </div>

      {/* Main Content */}
      <main className="max-w-[95%] xl:max-w-[1600px] mx-auto w-full px-4 py-8 pb-40 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* Column 1: Sipariş Özeti & Trust Badges */}
        <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-24">
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
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{trip.origin} → {trip.destination}</p>
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
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(trip.departureTime)} — {formatTime(trip.arrivalTime)}</p>
                </div>
              </div>

              {/* Bus Type */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Bus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Otobüs Tipi</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{trip.busType}</p>
                </div>
              </div>

              {/* Seats */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                    {selectedSeats.length > 1 ? 'Koltuk Numaraları' : 'Koltuk Numarası'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat}
                        className="inline-block font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg text-sm"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-200 dark:border-zinc-800" />

              {/* Price breakdown */}
              {selectedSeats.length > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-zinc-400">{selectedSeats.length} x ₺{trip.basePrice}</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">₺{totalPrice()}</span>
                </div>
              )}

              {/* Total Price */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800 dark:text-white">Toplam Tutar</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">₺{totalPrice()}</span>
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
          {/* Dynamic Passenger Form (Zustand-powered) */}
          <PassengerForm />

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
                  disabled={!canSubmit || isPaymentLoading}
                  className="w-full h-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPaymentLoading ? (
                    <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Lock size={20} />
                  )}
                  {isPaymentLoading ? 'İşleniyor...' : 'Bilgileri Onayla ve Ödemeye Geç'}
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
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.4, delay: 0.4 }}>
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
        &copy; 2026 TransitIQ. Tüm Hakları Saklıdır. Güvenli Ödeme Altyapısı iyzico.
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
