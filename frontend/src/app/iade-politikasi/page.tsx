import { ContentPage, LegalSection } from "@/components/content-page";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, CreditCard, AlertTriangle } from "lucide-react";

export const metadata = { title: 'İade Politikası — TransitIQ' };

export default function RefundPage() {
  return (
    <ContentPage
      eyebrow="Politika"
      title="İade Politikası"
      subtitle="Bilet iptali ve para iadesi kuralları, zaman sınırları ve süreç."
      updatedAt="Nisan 2026"
      crumbs={[{ label: 'İade Politikası' }]}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">6 saatten fazla</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">%100 İade</p>
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-1">Kalkışa 6 saatten fazla varsa tam iade</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-3" />
          <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">2-6 saat kala</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">Manuel Değerlendirme</p>
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-1">Destek ile iletişime geçin</p>
        </div>
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-5">
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mb-3" />
          <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-1">2 saatten az</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">İade Yapılmaz</p>
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-1">Sefer saatine 2 saatten az kaldıysa</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8">
        <LegalSection number="1." title="Cayma Hakkı">
          <p>6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi (g) bendi uyarınca, belirli bir tarihte yapılması gereken yolcu taşıma hizmetlerinde cayma hakkı kullanılamaz.</p>
          <p>Ancak TransitIQ, müşteri memnuniyeti politikası gereği aşağıdaki iade koşullarını uygular.</p>
        </LegalSection>

        <LegalSection number="2." title="İade Koşulları">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Kalkış saatine 6 saatten fazla süre varsa:</strong> %100 iade (otomatik), bilet ücreti kartınıza iade edilir.</li>
            <li><strong>Kalkış saatine 2-6 saat varsa:</strong> Destek ekibi talep doğrultusunda iade değerlendirir.</li>
            <li><strong>Kalkış saatine 2 saatten az kalmışsa:</strong> İade yapılmaz. Sefer saatinde gelmezseniz bilet NO_SHOW olarak işaretlenir.</li>
          </ul>
        </LegalSection>

        <LegalSection number="3." title="İade Süreci">
          <p>İade talebi iki yoldan yapılabilir:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Kayıtlı kullanıcı:</strong> <Link href="/hesap/biletlerim" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Biletlerim</Link> sayfasından &quot;İptal Et&quot; butonuna basın.
            </li>
            <li>
              <strong>Misafir kullanıcı:</strong> <Link href="/bilet-takip" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Bilet Takibi</Link> üzerinden PNR ve email ile giriş yapıp iptal edin.
            </li>
          </ol>
        </LegalSection>

        <LegalSection number="4." title="İade Süresi">
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Iyzico üzerinden otomatik iade</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">İptal onaylandığında Iyzico&apos;ya iade talebi gönderilir. Tutar, kartınızın bağlı olduğu bankaya göre <strong>3-7 iş günü</strong> içinde hesabınıza yansır.</p>
            </div>
          </div>
        </LegalSection>

        <LegalSection number="5." title="Özel Durumlar">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Sefer iptali:</strong> Otobüs firması tarafından iptal edilen seferlerde %100 iade yapılır, süre sınırı uygulanmaz.</li>
            <li><strong>Sefer gecikmesi:</strong> 3 saat ve üzeri gecikmelerde iade talep edebilirsiniz (destek değerlendirir).</li>
            <li><strong>Çoklu bilet:</strong> 5 yolcu için alınan bir biletten 1 tanesini iptal ederseniz, sadece o biletin tutarı iade edilir.</li>
            <li><strong>Promosyon kodu kullanımı:</strong> Kod ile düşürülen tutar değil, ödenen net tutar iade edilir.</li>
          </ul>
        </LegalSection>

        <LegalSection number="6." title="İade Kabul Edilmeyen Durumlar">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <ul className="list-disc pl-5 space-y-1 text-sm text-red-800 dark:text-red-300">
              <li>Sahte kimlik veya başkasının kartıyla yapılan işlemler</li>
              <li>Yolculuk başlamış ve yolcu otobüse binmişse</li>
              <li>Kalkış saatine 2 saatten az süre kalmışsa</li>
              <li>Bilet başka birine transfer edildiyse</li>
            </ul>
          </div>
        </LegalSection>

        <LegalSection number="7." title="Destek">
          <p>İade ile ilgili sorularınız veya özel talepleriniz için <a href="mailto:destek@transitiq.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">destek@transitiq.com</a> veya WhatsApp üzerinden <strong>+48 881 730 681</strong> numarasına yazabilirsiniz.</p>
        </LegalSection>
      </div>
    </ContentPage>
  );
}
