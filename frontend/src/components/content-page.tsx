"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";

interface ContentPageProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  updatedAt?: string;
  crumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
  narrow?: boolean;
}

export function ContentPage({ eyebrow, title, subtitle, updatedAt, crumbs, children, narrow = true }: ContentPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative border-b border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-transparent dark:from-indigo-950/20 pointer-events-none" />
        <div className={`${narrow ? 'max-w-4xl' : 'max-w-6xl'} mx-auto px-6 py-14 relative`}>
          {crumbs && crumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 mb-5">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Ana Sayfa</Link>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 opacity-50" />
                  {c.href ? (
                    <Link href={c.href} className="hover:text-indigo-600 dark:hover:text-indigo-400">{c.label}</Link>
                  ) : (
                    <span className="text-slate-700 dark:text-zinc-300">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              {eyebrow}
            </div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3 leading-[1.1]"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-base md:text-lg text-slate-600 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}

          {updatedAt && (
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-5 uppercase tracking-widest">
              Son güncelleme: {updatedAt}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <main className={`${narrow ? 'max-w-4xl' : 'max-w-6xl'} mx-auto px-6 py-12`}>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

/* LegalSection — no hooks, pure presentational */
export function LegalSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-3 flex items-start gap-2">
        <span className="text-indigo-600 dark:text-indigo-400 font-mono">{number}</span>
        <span>{title}</span>
      </h2>
      <div className="text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed space-y-3 pl-7">
        {children}
      </div>
    </section>
  );
}

/* FaqItem — uses native <details>, no React state */
export function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl px-5 py-4 cursor-pointer transition-colors hover:border-indigo-200 dark:hover:border-indigo-800">
      <summary className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white list-none">
        <span className="flex-1 pr-4">{q}</span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
      </summary>
      <div className="mt-3 text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">{a}</div>
    </details>
  );
}
