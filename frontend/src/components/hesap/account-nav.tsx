"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, User, Wallet, Bell, Award, Gift, LogOut, BellRing, FileLock, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const ITEMS = [
  { href: '/hesap/biletlerim', label: 'Biletlerim', icon: Ticket },
  { href: '/hesap/bekleme-listem', label: 'Bekleme Listem', icon: BellRing },
  { href: '/hesap/cuzdan', label: 'Cüzdan', icon: Wallet },
  { href: '/hesap/fiyat-alarmlari', label: 'Fiyat Alarmları', icon: Bell },
  { href: '/hesap/rozetler', label: 'Rozetler', icon: Award },
  { href: '/hesap/davet', label: 'Arkadaş Davet Et', icon: Gift },
  { href: '/hesap/profil', label: 'Profil Ayarları', icon: User },
  { href: '/hesap/guvenlik', label: 'Güvenlik', icon: Shield },
  { href: '/hesap/kvkk', label: 'KVKK Hakları', icon: FileLock },
];

export function AccountNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-2 sticky top-20">
      <div className="space-y-0.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors mt-2"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </nav>
  );
}
