import Link from "next/link";
import { Users, Code2, Palette, Megaphone, Mail, Sparkles, Heart } from "lucide-react";
import { ContentPage } from "@/components/content-page";

const FUTURE_ROLES = [
  {
    icon: Code2,
    title: 'Full-Stack Developer',
    area: 'Mühendislik',
    description: 'Next.js + NestJS stack üzerinde ürünü büyütmek. TypeScript, Prisma, React deneyimi.',
  },
  {
    icon: Palette,
    title: 'Product Designer',
    area: 'Tasarım',
    description: 'Yolcu akışı, admin paneli ve mobil uygulama için kullanıcı araştırması ve UI tasarımı.',
  },
  {
    icon: Megaphone,
    title: 'Growth & Marketing',
    area: 'Pazarlama',
    description: 'Otobüs firmaları ile B2B ilişkileri, içerik pazarlaması, SEO ve topluluk büyütme.',
  },
];

const VALUES = [
  { title: 'Uzaktan öncelikli', desc: 'Nerede olduğun değil, ne yaptığın önemli.' },
  { title: 'Şeffaflık', desc: 'Kararlar açık tartışılır, bilgi saklanmaz.' },
  { title: 'Öğrenmeye açık', desc: 'Sahte uzman olmaktan, gerçek öğrenciye her zaman razıyız.' },
  { title: 'Kullanıcı odaklı', desc: 'Feature değil, problem çözeriz.' },
];

export const metadata = { title: 'Kariyer — TransitIQ' };

export default function CareerPage() {
  return (
    <ContentPage
      eyebrow="Kariyer"
      title="Ekibimize katıl"
      subtitle="TransitIQ şu an erken aşamada. Birlikte büyürsek sen de hikayemizin bir parçası olursun."
      crumbs={[{ label: 'Kariyer' }]}
      narrow={false}
    >
      {/* No open positions banner */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-8 md:p-10 text-center mb-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center mb-4 shadow-sm">
          <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">
          Şu an aktif açık pozisyon yok
        </h2>
        <p className="text-slate-600 dark:text-zinc-400 font-medium max-w-xl mx-auto mb-5 leading-relaxed">
          TransitIQ henüz tek kişilik bir girişim. Ama ürün büyüdükçe aşağıdaki alanlarda arkadaşlar arayacağız.
          Şimdiden tanışmak istersen mesajını bekliyorum.
        </p>
        <a
          href="mailto:kariyer@transitiq.com"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold text-sm"
        >
          <Mail className="w-4 h-4" /> CV ile bekliyoruz
        </a>
      </div>

      {/* Future Roles */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-zinc-300">Gelecekte Bekleyen Roller</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FUTURE_ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">{r.area}</p>
                <h3 className="text-base font-black tracking-tighter text-slate-900 dark:text-white mb-2">{r.title}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">{r.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Values */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Nasıl bir yerde çalışacaksın?</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">İlkelerimiz, kültürümüz.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VALUES.map((v) => (
            <div key={v.title} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
              <p className="text-sm font-black text-slate-900 dark:text-white mb-1">{v.title}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 text-center">
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-3">
          Listede yer almayan bir yeteneğe sahipsen ve TransitIQ&apos;ya nasıl katkıda bulunabileceğine inanıyorsan:
        </p>
        <Link href="/iletisim" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
          Birlikte Çalışmak İstiyorum →
        </Link>
      </div>
    </ContentPage>
  );
}
