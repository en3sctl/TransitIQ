import Link from "next/link";
import { Download, Mail, Info, Image as ImageIcon, FileText, Newspaper } from "lucide-react";
import { ContentPage } from "@/components/content-page";

export const metadata = { title: 'Basın Merkezi — TransitIQ' };

export default function PressPage() {
  return (
    <ContentPage
      eyebrow="Basın"
      title="Basın Merkezi"
      subtitle="TransitIQ hakkında makale yazmak, röportaj yapmak veya basın kiti edinmek istiyorsanız doğru yerdesiniz."
      crumbs={[{ label: 'Basın' }]}
      narrow={false}
    >
      {/* Quick Facts */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Hızlı Bilgi</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Kuruluş', value: '2026' },
            { label: 'Merkez', value: 'İstanbul, TR' },
            { label: 'Ekip', value: '1 Kişi' },
            { label: 'Kategori', value: 'SaaS / Ulaşım' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">{label}</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Boilerplate */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Resmi Açıklama (Boilerplate)</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed bg-slate-50 dark:bg-zinc-800/50 p-5 rounded-xl italic">
          &quot;TransitIQ, 2026 yılında İstanbul&apos;da kurulan, şehirlerarası otobüs bileti ve filo yönetimi alanında faaliyet gösteren bir SaaS platformudur.
          Yolcu deneyimini modern web standartlarıyla yeniden tasarlayan TransitIQ; otobüs firmalarına tam entegre bilet satış,
          rezervasyon ve operasyon yönetim altyapısı sunmaktadır.&quot;
        </p>
      </div>

      {/* Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
            <ImageIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white mb-2">Logo & Görsel Paket</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-4 leading-relaxed">
            Yüksek çözünürlüklü logo varyantları (PNG, SVG), marka renkleri ve uygulama örnekleri.
          </p>
          <a
            href="/logoo.png"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Logo İndir (PNG)
          </a>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
            <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white mb-2">Kurucu Röportaj</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-4 leading-relaxed">
            Kurucu Enes Çatal ile yazılı veya video röportaj talebi için basın iletişim kanalını kullanın.
          </p>
          <a
            href="mailto:basin@transitiq.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
          >
            <Mail className="w-3.5 h-3.5" /> Röportaj Talebi
          </a>
        </div>
      </div>

      {/* Contact */}
      <div className="p-8 bg-indigo-600 text-white rounded-3xl text-center">
        <Mail className="w-10 h-10 mx-auto mb-4 opacity-90" />
        <h3 className="text-2xl font-black tracking-tighter mb-2">Basın İletişim</h3>
        <p className="text-indigo-100 font-medium text-sm mb-5">Her türlü basın talebi için direkt yazabilirsiniz.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a href="mailto:basin@transitiq.com" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-sm">
            basin@transitiq.com
          </a>
          <Link href="/iletisim" className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/25 transition-colors">
            İletişim Formu
          </Link>
        </div>
      </div>
    </ContentPage>
  );
}
