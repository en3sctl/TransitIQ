import { ContentPage, LegalSection } from "@/components/content-page";

export const metadata = { title: 'Çerez Politikası — TransitIQ' };

export default function CookiePage() {
  return (
    <ContentPage
      eyebrow="Yasal Metin"
      title="Çerez Politikası"
      subtitle="Web sitemizde kullanılan çerezler ve amaçları hakkında."
      updatedAt="Nisan 2026"
      crumbs={[{ label: 'Çerez Politikası' }]}
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8">
        <LegalSection number="1." title="Çerez Nedir?">
          <p>Çerezler, ziyaret ettiğiniz web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır. Kullanıcı deneyimini iyileştirmek, oturum açık tutmak, tercihleri hatırlamak için kullanılır.</p>
        </LegalSection>

        <LegalSection number="2." title="Kullandığımız Çerezler">
          <p>TransitIQ yalnızca <strong>gerekli</strong> ve <strong>fonksiyonel</strong> çerezler kullanır:</p>
          <div className="mt-3 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">Çerez Adı</th>
                  <th className="text-left px-3 py-2 font-bold">Amaç</th>
                  <th className="text-left px-3 py-2 font-bold">Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                <tr><td className="px-3 py-2 font-mono">token</td><td className="px-3 py-2">Oturum açık tutma</td><td className="px-3 py-2">24 saat</td></tr>
                <tr><td className="px-3 py-2 font-mono">user</td><td className="px-3 py-2">Kullanıcı profili (rol, ad)</td><td className="px-3 py-2">24 saat</td></tr>
                <tr><td className="px-3 py-2 font-mono">theme</td><td className="px-3 py-2">Açık / koyu mod tercihi</td><td className="px-3 py-2">1 yıl</td></tr>
                <tr><td className="px-3 py-2 font-mono">x-session-id</td><td className="px-3 py-2">Geçici koltuk kilidi</td><td className="px-3 py-2">10 dk</td></tr>
              </tbody>
            </table>
          </div>
        </LegalSection>

        <LegalSection number="3." title="Kullanmadığımız Çerezler">
          <p>TransitIQ <strong>kesinlikle kullanmaz</strong>:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Üçüncü taraf reklam takip çerezleri</li>
            <li>Sosyal medya piksel takibi (Facebook, Google Ads vb.)</li>
            <li>Davranışsal hedefleme için veri toplayan çerezler</li>
          </ul>
        </LegalSection>

        <LegalSection number="4." title="Çerezleri Nasıl Yönetirsiniz?">
          <p>Tarayıcınızın ayarlarından çerezleri reddedebilir veya silebilirsiniz:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Chrome:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
            <li><strong>Firefox:</strong> Seçenekler → Gizlilik ve Güvenlik</li>
            <li><strong>Safari:</strong> Tercihler → Gizlilik</li>
            <li><strong>Edge:</strong> Ayarlar → Gizlilik, Arama ve Hizmetler</li>
          </ul>
          <p className="mt-2 text-xs">Not: Gerekli çerezler kapatılırsa oturum açma ve bilet alma çalışmaz.</p>
        </LegalSection>

        <LegalSection number="5." title="İletişim">
          <p>Çerezler hakkında sorularınız için <a href="mailto:kvkk@transitiq.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">kvkk@transitiq.com</a> adresine yazabilirsiniz.</p>
        </LegalSection>
      </div>
    </ContentPage>
  );
}
