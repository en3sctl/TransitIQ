"use client";

import { useEffect, useState } from "react";
import { X, Info, AlertTriangle, AlertOctagon } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  linkUrl: string | null;
  linkLabel: string | null;
}

const DISMISS_KEY = 'transitiq.dismissed.announcements.v1';

function loadDismissed(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    // 7-day TTL
    const now = Date.now();
    const fresh: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (now - v < 7 * 24 * 60 * 60 * 1000) fresh[k] = v;
    }
    return fresh;
  } catch { return {}; }
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

/**
 * Platform-wide announcement banner. Fetches active announcements for the
 * current audience and displays the top non-dismissed one.
 */
export function AnnouncementBanner({ audience = 'PASSENGERS' }: { audience?: 'PASSENGERS' | 'COMPANY_ADMINS' | 'DRIVERS' }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, number>>({});

  useEffect(() => {
    setDismissed(loadDismissed());
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${apiBase()}/announcements/active?audience=${audience}`, { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, [audience]);

  const visible = items.filter((a) => !dismissed[a.id]);
  if (visible.length === 0) return null;
  const a = visible[0]; // show top 1 only; stack can come later

  // Flat tone — gradient'ler "AI web design" hissi veriyordu, Linear tarzı tek renk
  const toneMap: Record<string, { bg: string; icon: any }> = {
    INFO: { bg: 'bg-indigo-600', icon: Info },
    WARNING: { bg: 'bg-amber-500', icon: AlertTriangle },
    CRITICAL: { bg: 'bg-rose-600', icon: AlertOctagon },
  };
  const meta = toneMap[a.severity] || toneMap.INFO;
  const Icon = meta.icon;

  const dismiss = () => {
    const next = { ...dismissed, [a.id]: Date.now() };
    setDismissed(next);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  };

  return (
    <div className={`${meta.bg} text-white relative`}>
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3">
        <Icon className="w-4 h-4 shrink-0" />
        <div className="flex-1 min-w-0 text-sm">
          <span className="font-bold">{a.title}</span>
          <span className="opacity-90 ml-2 hidden md:inline">{a.body}</span>
        </div>
        {a.linkUrl && (
          <a
            href={a.linkUrl}
            target={a.linkUrl.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur text-xs font-bold shrink-0"
          >
            {a.linkLabel || 'Detay'}
          </a>
        )}
        <button onClick={dismiss} className="p-1 rounded hover:bg-white/10 shrink-0" aria-label="Kapat">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
