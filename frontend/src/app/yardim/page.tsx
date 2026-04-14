import Link from "next/link";
import { Ticket, CreditCard, XCircle, User, Search, MessageCircle, FileText, Shield } from "lucide-react";
import { ContentPage } from "@/components/content-page";

const CATEGORIES = [
  {
    icon: Ticket,
    title: 'Bilet İşlemleri',
    description: 'Bilet alma, PNR sorgulama, koltuk seçimi hakkında.',
    articles: [
      { title: 'Nasıl bilet alırım?', href: '/sss' },
      { title: 'PNR kodum nedir, nerede?', href: '/sss' },
      { title: 'Çoklu bilet almak', href: '/sss' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Ödeme',
    description: 'Kart işlemleri, faturalar, güvenli ödeme.',
    articles: [
      { title: 'Kabul edilen kartlar', href: '/sss' },
      { title: '3D Secure nedir?', href: '/sss' },
      { title: 'Fatura talep etme', href: '/iletisim' },
    ],
  },
  {
    icon: XCircle,
    title: 'İptal ve İade',
    description: 'Bilet iptali, para iadesi ve süreler.',
    articles: [
      { title: 'İade politikasının tamamı', href: '/iade-politikasi' },
      { title: 'Biletimi nasıl iptal ederim?', href: '/sss' },
      { title: 'Para ne zaman iade edilir?', href: '/sss' },
    ],
  },
  {
    icon: User,
    title: 'Hesap Yönetimi',
    description: 'Hesap oluşturma, profil, güvenlik.',
    articles: [
      { title: 'Hesap oluşturma', href: '/hesap/kayit' },
      { title: 'Şifre sıfırlama', href: '/iletisim' },
      { title: 'Hesabımı silmek', href: '/gizlilik' },
    ],
  },
  {
    icon: FileText,
    title: 'Yasal Bilgiler',
    description: 'KVKK, kullanım şartları, politikalar.',
    articles: [
      { title: 'KVKK Aydınlatma Metni', href: '/kvkk' },
      { title: 'Kullanım Şartları', href: '/sartlar' },
      { title: 'Gizlilik Politikası', href: '/gizlilik' },
    ],
  },
  {
    icon: Shield,
    title: 'Güvenlik',
    description: 'Hesap güvenliği, dolandırıcılık, şifreleme.',
    articles: [
      { title: 'Güvenli ödeme nasıl çalışır?', href: '/sss' },
      { title: 'Şüpheli bir durum fark ettim', href: '/iletisim' },
      { title: 'Verilerim nasıl korunuyor?', href: '/gizlilik' },
    ],
  },
];

export const metadata = { title: 'Yardım Merkezi — TransitIQ' };

export default function HelpCenterPage() {
  return (
    <ContentPage
      eyebrow="Destek"
      title="Yardım Merkezi"
      subtitle="TransitIQ&apos;yu kullanırken ihtiyacınız olan her şey. Konu başlıklarından seçin veya direkt arama yapın."
      crumbs={[{ label: 'Yardım Merkezi' }]}
      narrow={false}
    >
      {/* Search hint */}
      <div className="mb-10 text-center">
        <Link
          href="/sss"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all text-sm font-semibold text-slate-700 dark:text-zinc-300"
        >
          <Search className="w-4 h-4 text-indigo-600" />
          SSS&apos;de soru ara...
        </Link>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base font-black tracking-tighter text-slate-900 dark:text-white mb-1">{c.title}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-4 leading-relaxed">{c.description}</p>
              <ul className="space-y-1.5">
                {c.articles.map((a) => (
                  <li key={a.title}>
                    <Link href={a.href} className="text-xs text-slate-700 dark:text-zinc-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 group">
                      <span className="w-1 h-1 bg-slate-400 rounded-full group-hover:bg-indigo-600 transition-colors" />
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl text-center">
        <MessageCircle className="w-10 h-10 mx-auto mb-4 opacity-90" />
        <h3 className="text-2xl font-black tracking-tighter mb-2">Hala yardıma mı ihtiyacın var?</h3>
        <p className="text-indigo-100 font-medium text-sm mb-5 max-w-md mx-auto">Email veya WhatsApp üzerinden seninle iletişime geçelim.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/iletisim" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:scale-[1.02] transition-transform">
            İletişim Formu
          </Link>
          <a href="https://wa.me/48881730681" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/25 transition-colors">
            WhatsApp
          </a>
        </div>
      </div>
    </ContentPage>
  );
}
