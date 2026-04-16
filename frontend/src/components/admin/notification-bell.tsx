"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, RotateCcw, Bus, Clock, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

interface Notif {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  tab: string;
  icon: any;
}

export function NotificationBell({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function load() {
    try {
      const res = await api.get('/analytics/overview');
      const data = res.data;
      const list: Notif[] = [];

      if (data.alerts.failedRefunds > 0) {
        list.push({
          id: 'failed-refunds',
          type: 'CRITICAL',
          title: `${data.alerts.failedRefunds} iade başarısız`,
          description: 'Iyzico üzerinden otomatik iade yapılamadı. Manuel müdahale gerekli.',
          tab: 'bookings',
          icon: RotateCcw,
        });
      }

      data.alerts.expiredVehicles.forEach((v: any, i: number) => {
        list.push({
          id: `expired-${v.id}`,
          type: 'CRITICAL',
          title: `${v.plate} süresi geçmiş`,
          description: `${v.muayeneExpired ? 'Muayene' : ''}${v.muayeneExpired && v.sigortaExpired ? ' + ' : ''}${v.sigortaExpired ? 'Sigorta' : ''} süresi dolmuş.`,
          tab: 'vehicles',
          icon: Bus,
        });
      });

      data.alerts.expiringVehicles.forEach((v: any) => {
        const days = Math.min(
          ...[v.muayene, v.sigorta].filter((d: any) => d).map((d: any) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000))
        );
        list.push({
          id: `expiring-${v.id}`,
          type: 'WARNING',
          title: `${v.plate} yaklaşıyor`,
          description: `${days} gün içinde muayene/sigorta yenilemesi lazım.`,
          tab: 'vehicles',
          icon: Clock,
        });
      });

      setNotifs(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const criticalCount = notifs.filter(n => n.type === 'CRITICAL').length;
  const totalCount = notifs.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-zinc-500 dark:text-zinc-400 flex items-center justify-center"
        aria-label="Bildirimler"
      >
        <Bell className="w-4 h-4" />
        {totalCount > 0 && (
          <span className={`absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black text-white flex items-center justify-center ${
            criticalCount > 0 ? 'bg-rose-500' : 'bg-amber-500'
          }`}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white">Bildirimler</h3>
                {totalCount > 0 && (
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{totalCount} yeni</span>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-400">Yükleniyor...</div>
              ) : notifs.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Her şey yolunda</p>
                  <p className="text-[11px] font-semibold text-zinc-400 mt-1">Acil müdahale gerektiren durum yok</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {notifs.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { setOpen(false); onNavigate?.(n.tab); }}
                      className="w-full flex items-start gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        n.type === 'CRITICAL' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        <n.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{n.title}</p>
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{n.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
