import { ContentPage, LegalSection } from "@/components/content-page";

export const metadata = { title: 'KVKK Aydınlatma Metni — TransitIQ' };

export default function KvkkPage() {
  return (
    <ContentPage
      eyebrow="Yasal Metin"
      title="KVKK Aydınlatma Metni"
      subtitle="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında bilgilendirme."
      updatedAt="Nisan 2026"
      crumbs={[{ label: 'KVKK Aydınlatma' }]}
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8">
        <LegalSection number="1." title="Veri Sorumlusu">
          <p>TransitIQ Ulaşım Teknolojileri (&quot;TransitIQ&quot;), 6698 sayılı KVKK kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi hukuka ve dürüstlük kuralına uygun olarak işler.</p>
          <p><strong>İletişim:</strong> destek@transitiq.com · +48 881 730 681 · İstanbul, Türkiye</p>
        </LegalSection>

        <LegalSection number="2." title="İşlenen Kişisel Veriler">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Kimlik:</strong> Ad, soyad, T.C. kimlik numarası</li>
            <li><strong>İletişim:</strong> E-posta, telefon numarası</li>
            <li><strong>Müşteri İşlem:</strong> PNR, rezervasyon bilgileri, ödeme tutarı</li>
            <li><strong>Finansal:</strong> Ödeme işlem ID (kart bilgileri <strong>saklanmaz</strong>, PCI-DSS sertifikalı Iyzico üzerinden işlenir)</li>
            <li><strong>Teknik:</strong> IP adresi, tarayıcı bilgileri, oturum çerezleri</li>
          </ul>
        </LegalSection>

        <LegalSection number="3." title="Verilerin İşlenme Amaçları">
          <ul className="list-disc pl-5 space-y-1">
            <li>Bilet rezervasyonu ve teslimatı</li>
            <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi (fatura, vergi)</li>
            <li>Müşteri hizmetleri ve destek süreçleri</li>
            <li>Güvenlik, dolandırıcılık önleme, sistem iyileştirmeleri</li>
          </ul>
        </LegalSection>

        <LegalSection number="4." title="Veri Aktarımı">
          <p>Kişisel verileriniz aşağıdaki taraflara aktarılabilir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Iyzico</strong> — ödeme altyapısı sağlayıcısı</li>
            <li><strong>Resend</strong> — transactional e-posta gönderim servisi</li>
            <li><strong>Yasal makamlar</strong> — mahkeme kararı veya yasal zorunluluk halinde</li>
            <li><strong>Taşıma firması</strong> — biletinizin ait olduğu otobüs firmasına, seferin gerçekleştirilmesi için sınırlı bilgiler</li>
          </ul>
        </LegalSection>

        <LegalSection number="5." title="Haklarınız">
          <p>KVKK 11. madde uyarınca:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşleme amacını ve verileri öğrenme</li>
            <li>Verilerin düzeltilmesini, silinmesini veya anonimleştirilmesini isteme</li>
            <li>Otomatik sistemlerle analiz edilmesine itiraz etme</li>
            <li>Zararın giderilmesini talep etme</li>
          </ul>
          <p className="mt-3">Bu haklarınızı kullanmak için <a href="mailto:kvkk@transitiq.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">kvkk@transitiq.com</a> adresine yazılı başvuruda bulunabilirsiniz.</p>
        </LegalSection>

        <LegalSection number="6." title="Veri Saklama Süresi">
          <p>Rezervasyon ve fatura verileri, Vergi Usul Kanunu gereği <strong>10 yıl</strong> süreyle saklanır. İletişim ve pazarlama verileri ise en fazla <strong>3 yıl</strong> veya siz silinmesini talep edene kadar tutulur.</p>
        </LegalSection>

        <LegalSection number="7." title="Güvenlik Tedbirleri">
          <p>TransitIQ, kişisel verilerinizi yetkisiz erişime, kayba, ifşaya karşı korumak için aşağıdaki tedbirleri alır:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>SSL/TLS şifrelemesi (tüm iletim)</li>
            <li>Veritabanı düzeyinde şifreleme</li>
            <li>Rol bazlı erişim kontrolü</li>
            <li>Düzenli güvenlik denetimleri</li>
            <li>PCI-DSS sertifikalı ödeme ortağı (Iyzico)</li>
          </ul>
        </LegalSection>
      </div>
    </ContentPage>
  );
}
