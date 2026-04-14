import { ContentPage, LegalSection } from "@/components/content-page";

export const metadata = { title: 'Kullanım Şartları — TransitIQ' };

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Yasal Metin"
      title="Kullanım Şartları"
      subtitle="TransitIQ platformunu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız."
      updatedAt="Nisan 2026"
      crumbs={[{ label: 'Kullanım Şartları' }]}
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8">
        <LegalSection number="1." title="Platform Tanımı">
          <p>TransitIQ, şehirlerarası otobüs bileti arama, satın alma ve yönetim hizmetleri sunan online bir platformdur. Otobüs taşımacılığını fiilen gerçekleştirmez; biletleme ve aracılık hizmeti sağlar.</p>
        </LegalSection>

        <LegalSection number="2." title="Hesap Oluşturma">
          <p>Hesap oluşturan kullanıcı:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>18 yaşını doldurmuş olmalıdır</li>
            <li>Gerçek ve güncel bilgiler vermelidir</li>
            <li>Hesap güvenliğinden (şifre vb.) kendisi sorumludur</li>
            <li>Hesabının başkası tarafından kullanılmasına izin vermez</li>
          </ul>
        </LegalSection>

        <LegalSection number="3." title="Bilet İşlemleri">
          <ul className="list-disc pl-5 space-y-1">
            <li>Bilet satın alırken girilen tüm yolcu bilgileri gerçek ve doğru olmalıdır</li>
            <li>PNR kodu yalnızca bilet sahibine ve yolcuya aittir; başkalarıyla paylaşılmamalıdır</li>
            <li>Sahte kimlikle alınan biletler iptal edilir, hukuki yollara başvurulur</li>
            <li>Yolculuk sırasında kimlik ibrazı zorunludur (T.C. kimlik kartı, pasaport vb.)</li>
          </ul>
        </LegalSection>

        <LegalSection number="4." title="Ödeme ve İade">
          <p>Ödemeler Iyzico altyapısı üzerinden güvenle gerçekleştirilir. İptal ve iade şartları için <a href="/iade-politikasi" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">İade Politikamızı</a> inceleyin.</p>
          <p>Özetle: kalkışa <strong>6 saatten fazla</strong> süre varsa ücretsiz iptal ve otomatik iade mümkündür.</p>
        </LegalSection>

        <LegalSection number="5." title="Kullanıcı Yükümlülükleri">
          <p>Platformu kullanırken aşağıdakilerden kaçınmalısınız:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sistemin güvenlik önlemlerini aşmaya çalışmak</li>
            <li>Otomatik araçlarla (bot) toplu işlem yapmak</li>
            <li>Hakaret, iftira içeren mesajlar göndermek</li>
            <li>Yasa dışı faaliyetler için biletleri kullanmak</li>
            <li>Başkasının kimlik bilgileriyle bilet almak</li>
          </ul>
        </LegalSection>

        <LegalSection number="6." title="Sorumluluk Sınırlaması">
          <p>TransitIQ, aracılık hizmeti sunar. Otobüs seferinin gecikmesi, iptali, aracın arızası gibi konulardan <strong>taşıyıcı firma</strong> sorumludur. TransitIQ bu konularda aracılık desteği sağlar ancak taşıma sorumluluğunu taşımaz.</p>
          <p>Platform kesintisi, teknik aksaklık gibi durumlarda en kısa sürede çözüm sağlanır; dolaylı zararlardan sorumluluk kabul edilmez.</p>
        </LegalSection>

        <LegalSection number="7." title="Fikri Mülkiyet">
          <p>TransitIQ markası, logosu, tasarımı ve yazılımı TransitIQ Ulaşım Teknolojileri&apos;ne aittir. İzinsiz kullanım, kopyalama veya dağıtım yasaktır.</p>
        </LegalSection>

        <LegalSection number="8." title="Değişiklikler">
          <p>Bu şartlar önceden bildirmeksizin güncellenebilir. Platformu kullanmaya devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.</p>
        </LegalSection>

        <LegalSection number="9." title="Uyuşmazlık Çözümü">
          <p>Bu şartlardan doğan uyuşmazlıklarda <strong>İstanbul Mahkemeleri ve İcra Daireleri</strong> yetkilidir. Önce dostane çözüm için iletişime geçmenizi öneririz: <a href="mailto:destek@transitiq.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">destek@transitiq.com</a></p>
        </LegalSection>
      </div>
    </ContentPage>
  );
}
