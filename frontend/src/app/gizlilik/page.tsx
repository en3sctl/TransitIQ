import { ContentPage, LegalSection } from "@/components/content-page";

export const metadata = { title: 'Gizlilik Politikası — TransitIQ' };

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Yasal Metin"
      title="Gizlilik Politikası"
      subtitle="Kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz hakkında."
      updatedAt="Nisan 2026"
      crumbs={[{ label: 'Gizlilik Politikası' }]}
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8">
        <LegalSection number="1." title="Toplanan Veriler">
          <p>TransitIQ olarak yalnızca hizmet sunumu için gerekli olan minimum veriyi toplarız:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kayıt bilgileri (ad, e-posta, telefon)</li>
            <li>Rezervasyon verileri (PNR, tarih, güzergah, koltuk)</li>
            <li>Ödeme işlem referansı (kart verisi <strong>asla</strong> sunucumuza değmez)</li>
            <li>Çerez ve oturum verileri</li>
          </ul>
        </LegalSection>

        <LegalSection number="2." title="Kullanım Amaçları">
          <p>Verileriniz sadece aşağıdaki amaçlarla kullanılır:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Biletinizi oluşturmak, PNR üretmek, PDF ve e-posta ile göndermek</li>
            <li>Ödeme işlemini güvenle tamamlamak</li>
            <li>Yolculuk hatırlatmaları, sefer değişikliği bildirimleri göndermek</li>
            <li>Yasal yükümlülükler (vergi, fatura, arşiv)</li>
            <li>Ürünü iyileştirmek (anonimleştirilmiş kullanım istatistikleri)</li>
          </ul>
        </LegalSection>

        <LegalSection number="3." title="Paylaşım">
          <p>Verileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Biletinizin ait olduğu otobüs firmasıyla (yalnızca sefer için gerekli bilgiler)</li>
            <li>Ödeme altyapısı sağlayıcımız Iyzico ile (işlem için)</li>
            <li>Yasal zorunluluk hallerinde yetkili makamlarla</li>
          </ul>
          <p>Verileriniz <strong>asla satılmaz</strong>, pazarlama için üçüncü şahıslara verilmez.</p>
        </LegalSection>

        <LegalSection number="4." title="Haklarınız">
          <p>Dilediğiniz zaman:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hesabınızdan profil bilgilerinizi güncelleyebilir</li>
            <li>E-posta ile <strong>kvkk@transitiq.com</strong> adresine yazarak verilerinizin silinmesini talep edebilir</li>
            <li>Biletlerinizin geçmişini &quot;Biletlerim&quot; sayfasından görebilirsiniz</li>
          </ul>
        </LegalSection>

        <LegalSection number="5." title="Çerezler">
          <p>TransitIQ zorunlu oturum çerezleri ve tercih çerezleri kullanır (tema seçimi vb). Üçüncü taraf izleme çerezi kullanmaz. Detaylar için <a href="/cerez" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Çerez Politikamızı</a> okuyabilirsiniz.</p>
        </LegalSection>

        <LegalSection number="6." title="Değişiklikler">
          <p>Bu politika gerekli hallerde güncellenebilir. Önemli değişikliklerde kayıtlı e-postanıza bildirim göndereceğiz. Son güncelleme tarihi sayfanın üstündedir.</p>
        </LegalSection>

        <LegalSection number="7." title="İletişim">
          <p>Gizlilik ile ilgili sorularınız için <a href="mailto:kvkk@transitiq.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">kvkk@transitiq.com</a> veya <a href="/iletisim" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">iletişim formunu</a> kullanabilirsiniz.</p>
        </LegalSection>
      </div>
    </ContentPage>
  );
}
