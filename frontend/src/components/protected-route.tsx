"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

export type AppRole = 'PASSENGER' | 'DRIVER' | 'COMPANY_ADMIN' | 'SUPER_ADMIN' | 'OPERATOR';

interface Props {
  children: React.ReactNode;
  /** If provided, only these roles can access. Otherwise, any authenticated user. */
  allowedRoles?: AppRole[];
  /** Where to send unauthenticated users. Defaults to /hesap/giris for passenger pages, /login for admin. */
  loginPath?: string;
}

/**
 * Route guard: redirects unauthenticated users to login, and mismatched roles to their home.
 */
export default function ProtectedRoute({ children, allowedRoles, loginPath }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const destination = loginPath || inferLoginPath(allowedRoles);
      router.push(destination);
      return;
    }

    // User exists but role not allowed — send to their natural home
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role as AppRole)) {
      router.push(homeForRole(user.role as AppRole));
    }
  }, [user, loading, router, allowedRoles, loginPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) return null;

  if (allowedRoles && !allowedRoles.includes(user.role as AppRole)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-500" />
        <p className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">Bu sayfaya erişim yetkin yok</p>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Uygun panele yönlendiriliyorsun...</p>
      </div>
    );
  }

  return <>{children}</>;
}

function inferLoginPath(allowedRoles?: AppRole[]): string {
  if (!allowedRoles) return '/hesap/giris';
  if (allowedRoles.includes('PASSENGER')) return '/hesap/giris';
  return '/login';
}

export function homeForRole(role: AppRole): string {
  switch (role) {
    case 'PASSENGER': return '/hesap/biletlerim';
    case 'DRIVER': return '/driver';
    case 'COMPANY_ADMIN':
    case 'SUPER_ADMIN':
    case 'OPERATOR':
      return '/admin';
    default: return '/';
  }
}
