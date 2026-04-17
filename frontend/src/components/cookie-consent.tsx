"use client";

import { useEffect, useState } from "react";
import { Cookie, X, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

const CONSENT_KEY = 'transitiq.cookie.consent.v1';

interface Consent {
  necessary: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  at: number;
}

function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }

function loadConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveConsent(c: Consent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  // Persist to backend consent log (best-effort)
  const token = localStorage.getItem('token');
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (const kind of ['COOKIE_ANALYTICS', 'COOKIE_MARKETING'] as const) {
    fetch(`${apiBase()}/consent`, {
      method: 'POST', headers,
      body: JSON.stringify({ kind, granted: kind === 'COOKIE_ANALYTICS' ? c.analytics : c.marketing }),
    }).catch(() => {});
  }
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) setShow(true);
    else { setAnalytics(existing.analytics); setMarketing(existing.marketing); }
  }, []);

  if (!show) return null;

  const accept = (opts?: { analytics: boolean; marketing: boolean }) => {
    const consent: Consent = {
      necessary: true,
      analytics: opts?.analytics ?? analytics,
      marketing: opts?.marketing ?? marketing,
      at: Date.now(),
    };
    saveConsent(consent);
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[90]">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Çerez Kullanımı</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">
                Oturum, güvenlik ve arama deneyimi için zorunlu çerezler kullanıyoruz.
                Analitik ve pazarlama çerezleri için onayını sorarız.
                Detay: <Link href="/cerez" className="text-indigo-600 dark:text-indigo-400 font-bold underline">Çerez Politikası</Link>
              </p>
            </div>
          </div>

          {detail && (
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 opacity-60">
                <input type="checkbox" checked disabled className="rounded" />
                <span className="text-xs font-bold flex-1">Zorunlu (her zaman aktif)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 cursor-pointer">
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="rounded cursor-pointer" />
                <span className="text-xs font-bold flex-1">Analitik (nasıl kullanıyorsun)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 cursor-pointer">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="rounded cursor-pointer" />
                <span className="text-xs font-bold flex-1">Pazarlama (kişiselleştirilmiş reklam)</span>
              </label>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => accept({ analytics: true, marketing: true })} className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs font-bold">
              Tümünü Kabul Et
            </button>
            <button onClick={() => accept({ analytics: false, marketing: false })} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">
              Zorunlu Olanlar
            </button>
            {!detail && (
              <button onClick={() => setDetail(true)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800" title="Ayrıntılar">
                <SettingsIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {detail && (
              <button onClick={() => accept()} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                Kaydet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
