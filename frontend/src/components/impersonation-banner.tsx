"use client";

import { useEffect, useState } from "react";
import { LogOut, UserCog, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Floating banner visible when a SUPER_ADMIN is impersonating a tenant admin.
 * Shows who is being impersonated + an "Exit impersonation" button that
 * restores the original super-admin session.
 */
export function ImpersonationBanner() {
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState<{ asName: string; asEmail: string; byName?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setActive(false); return; }
        const payloadRaw = token.split('.')[1];
        if (!payloadRaw) return;
        const payload = JSON.parse(atob(payloadRaw.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.impersonatedBy) {
          setInfo({
            asName: payload.name || payload.email || 'Firma Admin',
            asEmail: payload.email,
            byName: payload.impersonatedBy.name,
          });
          setActive(true);
        } else {
          setActive(false);
        }
      } catch {
        setActive(false);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const exit = () => {
    // Restore super-admin session
    const saved = localStorage.getItem('super_admin_token');
    const savedUser = localStorage.getItem('super_admin_user');
    if (saved && savedUser) {
      localStorage.setItem('token', saved);
      localStorage.setItem('user', savedUser);
      localStorage.removeItem('super_admin_token');
      localStorage.removeItem('super_admin_user');
      toast.success('Süper admin oturumuna döndün');
      window.location.href = '/admin';
    } else {
      toast.error('Orijinal oturum bulunamadı — yeniden giriş yap');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  if (!active || !info) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
          <UserCog className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black">
            {info.asName} olarak görüntülüyorsun
          </p>
          <p className="text-[11px] font-semibold opacity-80 truncate">
            <Shield className="w-3 h-3 inline mr-1" />
            Super admin oturumu · Aksiyonların denetim logunda kaydediliyor
          </p>
        </div>
        <button
          onClick={exit}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur border border-white/20 text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Çık ve Super Admin'e Dön
        </button>
      </div>
    </div>
  );
}
