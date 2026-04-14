import Link from "next/link";
import { PenLine, Mail, Rocket, Zap, Code2 } from "lucide-react";
import { ContentPage } from "@/components/content-page";

const UPCOMING_TOPICS = [
  { icon: Rocket, title: 'TransitIQ nasıl inşa edildi', desc: 'Sıfırdan bir SaaS ürünü geliştirmenin mühendislik notları.' },
  { icon: Zap, title: 'Iyzico entegrasyonu rehberi', desc: 'Ödeme altyapısı kurulumunda öğrendiklerim.' },
  { icon: Code2, title: 'Next.js 16 + NestJS mimari', desc: 'Full-stack TypeScript stack notları.' },
];

export const metadata = { title: 'Blog — TransitIQ' };

export default function BlogPage() {
  return (
    <ContentPage
      eyebrow="Blog"
      title="Yolculuk ve Teknoloji"
      subtitle="TransitIQ ekibinden makaleler, güncel duyurular ve sektör analizi."
      crumbs={[{ label: 'Blog' }]}
      narrow={false}
    >
      {/* Empty state — coming soon */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-10 md:p-16 text-center mb-10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5">
          <PenLine className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Yakında yayında</h2>
        <p className="text-base text-slate-500 dark:text-zinc-400 font-medium max-w-lg mx-auto mb-8">
          İlk yazılarımız hazırlanıyor. Ürün yayınlanınca teknik yazılar, ulaşım sektörü analizleri ve topluluk hikayeleri burada olacak.
        </p>
        <Link
          href="/iletisim"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold text-sm hover:bg-black dark:hover:bg-white"
        >
          <Mail className="w-4 h-4" /> E-posta Bildirimine Kaydol
        </Link>
      </div>

      {/* Upcoming topics */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-4">Gelecek Yazılar</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {UPCOMING_TOPICS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 opacity-70">
                <Icon className="w-5 h-5 text-indigo-600 mb-3" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Taslak</p>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">{t.title}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </ContentPage>
  );
}
