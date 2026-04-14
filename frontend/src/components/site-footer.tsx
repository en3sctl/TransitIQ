import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Mail, Phone, MapPin, Twitter, Instagram, Facebook, Linkedin } from "lucide-react";

const SECTIONS = [
  {
    title: 'Ürün',
    links: [
      { label: 'Rotalar', href: '/rotalar' },
      { label: 'Fiyatlandırma', href: '/fiyatlandirma' },
      { label: 'Bilet Takibi', href: '/bilet-takip' },
      { label: 'Mobil Uygulama', href: '/blog' },
    ],
  },
  {
    title: 'Kurumsal',
    links: [
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Kariyer', href: '/kariyer' },
      { label: 'Basın Merkezi', href: '/basin' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { label: 'Yardım Merkezi', href: '/yardim' },
      { label: 'SSS', href: '/sss' },
      { label: 'İletişim', href: '/iletisim' },
      { label: 'İade Politikası', href: '/iade-politikasi' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { label: 'KVKK Aydınlatma', href: '/kvkk' },
      { label: 'Gizlilik Politikası', href: '/gizlilik' },
      { label: 'Kullanım Şartları', href: '/sartlar' },
      { label: 'Çerez Politikası', href: '/cerez' },
    ],
  },
];

const SOCIAL = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 relative z-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          {/* Brand col */}
          <div className="col-span-2">
            <BrandLogo width={220} height={120} className="h-11 w-auto mb-4" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mb-5">
              Türkiye&apos;nin yolculuk teknolojisi. Şehirlerarası otobüs biletini bul, sat, yönet.
            </p>
            <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:destek@transitiq.com" className="hover:text-indigo-600 dark:hover:text-indigo-400">destek@transitiq.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <a href="tel:+48881730681" className="hover:text-indigo-600 dark:hover:text-indigo-400">+48 881 730 681</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>İstanbul, Türkiye</span>
              </div>
            </div>
          </div>

          {/* Link cols */}
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-4">
                {s.title}
              </h3>
              <ul className="space-y-2.5">
                {s.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-zinc-600 dark:text-zinc-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            © {year} TransitIQ Ulaşım Teknolojileri A.Ş. &middot; Tüm hakları saklıdır.
          </p>

          <div className="flex items-center gap-4">
            {/* Payment methods */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Güvenli Ödeme</span>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">iyzico</span>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-1.5">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
