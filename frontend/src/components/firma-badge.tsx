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
  /** sm (28px) | md (40px) | lg (56px). Default md for trip cards. */
  size?: 'sm' | 'md' | 'lg';
  /** link to firma profile page (default true) */
  link?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 'w-7 h-7', radius: 'rounded-md', text: 'text-xs', initial: 'text-xs' },
  md: { box: 'w-10 h-10', radius: 'rounded-lg', text: 'text-sm', initial: 'text-base' },
  lg: { box: 'w-14 h-14', radius: 'rounded-xl', text: 'text-base', initial: 'text-xl' },
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

function toAbsoluteLogo(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return apiBase() + url;
}

export function FirmaBadge({ tenant, compact = false, size = 'md', link = true, className = '' }: Props) {
  if (!tenant) return null;

  const logo = toAbsoluteLogo(tenant.logoUrl);
  const initial = (tenant.name?.[0] || '?').toUpperCase();
  const color = tenant.brandColor || '#4f46e5';
  const sz = SIZE_MAP[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {logo ? (
        <div className={`${sz.box} ${sz.radius} bg-white dark:bg-zinc-100 border border-slate-200 dark:border-zinc-300 overflow-hidden shrink-0 flex items-center justify-center p-0.5`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={tenant.name} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div
          className={`${sz.box} ${sz.radius} shrink-0 flex items-center justify-center text-white ${sz.initial} font-black`}
          style={{ backgroundColor: color }}
          aria-label={tenant.name}
        >
          {initial}
        </div>
      )}
      {!compact && (
        <div className="flex items-center gap-1 min-w-0">
          <span className={`${sz.text} font-black text-slate-900 dark:text-white truncate max-w-[200px]`}>
            {tenant.name}
          </span>
          {tenant.verified && (
            <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" aria-label="Doğrulanmış firma" />
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
