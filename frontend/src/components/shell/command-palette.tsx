"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Home, Ticket, User, MapPin, Phone, FileText, HelpCircle,
  LayoutDashboard, Bus, Calendar, Users, Building2, Settings, LogOut,
  CreditCard, Shield, Cookie, Scale, Newspaper, Briefcase,
  Command as CommandIcon, ArrowRight, Sparkles, Moon, Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  group: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin = pathname?.startsWith('/admin');

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const commands = useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [
      { id: 'home', label: 'Ana Sayfa', icon: Home, group: 'Gezinti', action: () => go('/'), keywords: ['anasayfa', 'landing'] },
      { id: 'routes', label: 'Tüm Rotalar', icon: MapPin, group: 'Gezinti', action: () => go('/rotalar'), keywords: ['route', 'güzergah'] },
      { id: 'pricing', label: 'Fiyatlandırma', icon: CreditCard, group: 'Gezinti', action: () => go('/fiyatlandirma'), keywords: ['pricing', 'fiyat'] },
      { id: 'about', label: 'Hakkımızda', icon: Building2, group: 'Gezinti', action: () => go('/hakkimizda'), keywords: ['about'] },
      { id: 'contact', label: 'İletişim', icon: Phone, group: 'Gezinti', action: () => go('/iletisim'), keywords: ['contact'] },
      { id: 'tracking', label: 'Bilet Takibi', icon: Ticket, group: 'Biletler', action: () => go('/bilet-takip'), keywords: ['pnr', 'biletimi bul', 'track'] },
      { id: 'my-tickets', label: 'Biletlerim', icon: Ticket, group: 'Biletler', action: () => go('/hesap/biletlerim'), keywords: ['biletler', 'tickets'] },
      { id: 'account', label: 'Hesabım', icon: User, group: 'Biletler', action: () => go('/hesap'), keywords: ['profile', 'hesap'] },
      { id: 'help', label: 'Yardım Merkezi', icon: HelpCircle, group: 'Destek', action: () => go('/yardim') },
      { id: 'faq', label: 'Sıkça Sorulan Sorular', icon: FileText, group: 'Destek', action: () => go('/sss'), keywords: ['soru', 'faq'] },
      { id: 'blog', label: 'Blog', icon: Newspaper, group: 'Kurumsal', action: () => go('/blog') },
      { id: 'press', label: 'Basın Merkezi', icon: Newspaper, group: 'Kurumsal', action: () => go('/basin') },
      { id: 'careers', label: 'Kariyer', icon: Briefcase, group: 'Kurumsal', action: () => go('/kariyer') },
      { id: 'refund', label: 'İade Politikası', icon: CreditCard, group: 'Yasal', action: () => go('/iade-politikasi') },
      { id: 'kvkk', label: 'KVKK Aydınlatma Metni', icon: Shield, group: 'Yasal', action: () => go('/kvkk') },
      { id: 'privacy', label: 'Gizlilik Politikası', icon: Shield, group: 'Yasal', action: () => go('/gizlilik') },
      { id: 'terms', label: 'Kullanım Şartları', icon: Scale, group: 'Yasal', action: () => go('/sartlar') },
      { id: 'cookies', label: 'Çerez Politikası', icon: Cookie, group: 'Yasal', action: () => go('/cerez') },
    ];

    const adminCmds: CommandItem[] = isAdmin
      ? [
          { id: 'admin-dash', label: 'Admin Paneli', icon: LayoutDashboard, group: 'Admin', action: () => go('/admin') },
          { id: 'admin-vehicles', label: 'Filo Yönetimi', icon: Bus, group: 'Admin', action: () => go('/admin?tab=vehicles'), keywords: ['araç', 'fleet'] },
          { id: 'admin-trips', label: 'Seferler', icon: Calendar, group: 'Admin', action: () => go('/admin?tab=trips') },
          { id: 'admin-bookings', label: 'Rezervasyonlar', icon: Ticket, group: 'Admin', action: () => go('/admin?tab=bookings') },
          { id: 'admin-stations', label: 'Durak Yönetimi', icon: MapPin, group: 'Admin', action: () => go('/admin?tab=stations') },
          { id: 'admin-routes', label: 'Güzergahlar', icon: MapPin, group: 'Admin', action: () => go('/admin?tab=routes') },
          { id: 'admin-users', label: 'Kullanıcılar', icon: Users, group: 'Admin', action: () => go('/admin?tab=users') },
        ]
      : [];

    const settings: CommandItem[] = [
      {
        id: 'theme-light',
        label: 'Açık Tema',
        icon: Sun,
        group: 'Ayarlar',
        action: () => {
          setTheme('light');
          setOpen(false);
        },
        keywords: ['light', 'beyaz', 'gündüz'],
      },
      {
        id: 'theme-dark',
        label: 'Koyu Tema',
        icon: Moon,
        group: 'Ayarlar',
        action: () => {
          setTheme('dark');
          setOpen(false);
        },
        keywords: ['dark', 'siyah', 'gece'],
      },
    ];

    const auth: CommandItem[] = [
      { id: 'login', label: 'Giriş Yap', icon: User, group: 'Hesap', action: () => go('/login') },
      { id: 'register', label: 'Kayıt Ol', icon: User, group: 'Hesap', action: () => go('/register') },
    ];

    return [...adminCmds, ...base, ...auth, ...settings];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.label} ${c.group} ${c.keywords?.join(' ') || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, commands]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => Math.min(filtered.length - 1, h + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => Math.max(0, h - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[highlighted]?.action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, highlighted]);

  // Group filtered results
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((c) => {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group)!.push(c);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-zinc-800">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Komut, sayfa veya ayar ara..."
                className="flex-1 bg-transparent outline-none text-base font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400"
              />
              <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} data-lenis-prevent className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
                    "{query}" için sonuç yok
                  </p>
                </div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="mb-2 last:mb-0">
                    <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      {group}
                    </p>
                    {items.map((cmd) => {
                      const absoluteIndex = filtered.indexOf(cmd);
                      const isHighlighted = absoluteIndex === highlighted;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          onMouseEnter={() => setHighlighted(absoluteIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            isHighlighted
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100'
                              : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span className="flex-1 text-sm font-semibold">{cmd.label}</span>
                          {isHighlighted && <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">↑↓</kbd>
                  gezin
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">⏎</kbd>
                  seç
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                <CommandIcon className="w-3 h-3" /> K
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
