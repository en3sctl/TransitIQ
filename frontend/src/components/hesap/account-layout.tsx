"use client";

import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import { AccountNav } from "./account-nav";
import ProtectedRoute from "@/components/protected-route";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AccountLayout({ title, subtitle, children }: Props) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
        <LandingNav />

        <div className="max-w-6xl mx-auto px-6 pt-24 pb-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">{title}</h1>
            {subtitle && (
              <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium">{subtitle}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            <aside className="hidden lg:block">
              <AccountNav />
            </aside>
            <main>{children}</main>
          </div>
        </div>

        <SiteFooter />
      </div>
    </ProtectedRoute>
  );
}
