import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { BadgeCheck, MapPin, Phone, Mail, Globe, Star, Route as RouteIcon, CalendarDays, Ticket } from 'lucide-react';
import { LandingNav } from '@/components/landing-nav';
import { SiteFooter } from '@/components/site-footer';

interface Tenant {
  id: string;
  name: string;
  publicName: string | null;
  slug: string;
  status: string;
  logoUrl: string | null;
  brandColor: string | null;
  aboutShort: string | null;
  aboutLong: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  website: string | null;
  address: string | null;
  verifiedAt: string | null;
  createdAt: string;
  stats: {
    routes: number;
    upcomingTrips: number;
    averageRating: number;
    reviewCount: number;
    totalBookings: number;
  };
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

function toAbsolute(url: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : apiBase() + url;
}

async function fetchTenant(slug: string): Promise<Tenant | null> {
  try {
    const res = await fetch(`${apiBase()}/firma/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await fetchTenant(slug);
  if (!tenant) return { title: 'Firma Bulunamadı' };
  const name = tenant.publicName || tenant.name;
  return {
    title: `${name} · TransitIQ`,
    description: tenant.aboutShort || `${name} firmasına ait rotalar, seferler ve yolcu yorumları`,
  };
}

export default async function FirmaProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await fetchTenant(slug);
  if (!tenant) notFound();

  const displayName = tenant.publicName || tenant.name;
  const logo = toAbsolute(tenant.logoUrl);
  const brandColor = tenant.brandColor || '#4f46e5';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      {/* Hero with brand color */}
      <section className="relative border-b border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${brandColor}, transparent 60%), radial-gradient(circle at 80% 60%, ${brandColor}, transparent 50%)`,
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-12 relative">
          <div className="flex items-start gap-5 flex-col md:flex-row">
            {logo ? (
              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={displayName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-black shrink-0 shadow-lg"
                style={{ backgroundColor: brandColor }}
              >
                {displayName[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                  {displayName}
                </h1>
                {tenant.verifiedAt && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest">
                    <BadgeCheck className="w-3 h-3" /> Doğrulanmış
                  </span>
                )}
              </div>
              {tenant.aboutShort && (
                <p className="text-base text-slate-600 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl">
                  {tenant.aboutShort}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 flex-wrap text-xs font-bold text-slate-500 dark:text-zinc-400">
                {tenant.stats.averageRating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-slate-900 dark:text-white">{tenant.stats.averageRating.toFixed(1)}</span>
                    <span className="text-slate-400">({tenant.stats.reviewCount} yorum)</span>
                  </span>
                )}
                <span>·</span>
                <span>Üyelik: {new Date(tenant.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: RouteIcon, label: 'Rota', value: tenant.stats.routes, tone: 'indigo' },
            { icon: CalendarDays, label: 'Yaklaşan Sefer', value: tenant.stats.upcomingTrips, tone: 'emerald' },
            { icon: Ticket, label: 'Satılan Bilet', value: tenant.stats.totalBookings, tone: 'amber' },
            { icon: Star, label: 'Ort. Puan', value: tenant.stats.averageRating > 0 ? tenant.stats.averageRating.toFixed(1) : '—', tone: 'rose' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{s.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* About + Contact */}
      <section className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tenant.aboutLong && (
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Hakkında</h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed whitespace-pre-wrap">
              {tenant.aboutLong}
            </p>
          </div>
        )}

        <div className={`space-y-4 ${tenant.aboutLong ? '' : 'lg:col-span-3'}`}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">İletişim</h2>
            <div className="space-y-3 text-sm">
              {tenant.supportEmail && (
                <a href={`mailto:${tenant.supportEmail}`} className="flex items-center gap-3 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  {tenant.supportEmail}
                </a>
              )}
              {tenant.supportPhone && (
                <a href={`tel:${tenant.supportPhone}`} className="flex items-center gap-3 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  {tenant.supportPhone}
                </a>
              )}
              {tenant.website && (
                <a href={tenant.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold break-all">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  {tenant.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {tenant.address && (
                <div className="flex items-start gap-3 text-slate-700 dark:text-zinc-300 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{tenant.address}</span>
                </div>
              )}
              {!tenant.supportEmail && !tenant.supportPhone && !tenant.website && !tenant.address && (
                <p className="text-xs text-slate-400 font-medium">Firma henüz iletişim bilgilerini eklememiş.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
