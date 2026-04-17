'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';

interface Props {
  tenant?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string | null;
    verified: boolean;
  } | null;
  /** compact renders only the logo (no name), used in tight spaces */
  compact?: boolean;
  /** link to firma profile page (default true) */
  link?: boolean;
  className?: string;
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

function toAbsoluteLogo(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return apiBase() + url;
}

export function FirmaBadge({ tenant, compact = false, link = true, className = '' }: Props) {
  if (!tenant) return null;

  const logo = toAbsoluteLogo(tenant.logoUrl);
  const initial = (tenant.name?.[0] || '?').toUpperCase();
  const color = tenant.brandColor || '#4f46e5';

  const content = (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {logo ? (
        <div className="w-7 h-7 rounded-md bg-white dark:bg-zinc-100 border border-slate-200 dark:border-zinc-300 overflow-hidden shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={tenant.name} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div
          className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-white text-xs font-black"
          style={{ backgroundColor: color }}
          aria-label={tenant.name}
        >
          {initial}
        </div>
      )}
      {!compact && (
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[140px]">
            {tenant.name}
          </span>
          {tenant.verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" aria-label="Doğrulanmış firma" />
          )}
        </div>
      )}
    </div>
  );

  return link ? (
    <Link href={`/firma/${tenant.slug}`} onClick={(e) => e.stopPropagation()} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  ) : (
    content
  );
}
