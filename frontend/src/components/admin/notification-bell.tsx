"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, RotateCcw, Bus, Clock, CheckCircle2, ShieldAlert, MessageSquareWarning, ChevronDown, ChevronRight, CheckCheck } from "lucide-react";
import api from "@/lib/api";
import { useVisibleInterval } from "@/lib/use-visible-interval";

type NotifType = 'CRITICAL' | 'WARNING' | 'INFO';
type NotifCategory = 'COMPLAINTS' | 'VEHICLES' | 'PAYMENTS' | 'DRIVER_OPS' | 'OTHER';

interface Notif {
  id: string;
  type: NotifType;
  category: NotifCategory;
  title: string;
  description: string;
  tab: string;
  icon: any;
}

const CATEGORY_META: Record<NotifCategory, { label: string; icon: any; tone: string }> = {
  COMPLAINTS: { label: 'Şikayetler', icon: ShieldAlert, tone: 'rose' },
  DRIVER_OPS: { label: 'Şoför Operasyonları', icon: AlertTriangle, tone: 'pink' },
  VEHICLES: { label: 'Araç Uyarıları', icon: Bus, tone: 'amber' },
  PAYMENTS: { label: 'Ödeme / İade', icon: RotateCcw, tone: 'indigo' },
  OTHER: { label: 'Diğer', icon: AlertTriangle, tone: 'slate' },
};

// DRIVER_OPS ön sırada — SOS en kritik, masraf/pre-trip da admin aksiyonu bekliyor
const CATEGORY_ORDER: NotifCategory[] = ['DRIVER_OPS', 'COMPLAINTS', 'PAYMENTS', 'VEHICLES', 'OTHER'];
const TONE_CLASS: Record<string, string> = {
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  pink: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400',
};

const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
  DELAY: 'Gecikme', DRIVER: 'Şoför', CLEANLINESS: 'Temizlik',
  PAYMENT: 'Ödeme', SEAT: 'Koltuk', OTHER: 'Diğer',
};
const COMPLAINT_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük', NORMAL: 'Normal', HIGH: 'Yüksek', URGENT: 'Acil',
};
const categoryLabel = (c: string) => COMPLAINT_CATEGORY_LABELS[c] || c;
const priorityLabel = (p: string) => COMPLAINT_PRIORITY_LABELS[p] || p;

// Dismissal store — keeps an id → timestamp map. An entry older than TTL is
// reactivated, so admins are re-notified if the underlying issue persists.
const DISMISS_KEY = 'transitiq.admin.dismissedNotifs.v1';
const DISMISS_TTL_MS = 12 * 60 * 60 * 1000;

function loadDismissed(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const fresh: Record<string, number> = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (now - ts < DISMISS_TTL_MS) fresh[id] = ts;
    }
    return fresh;
  } catch {
    return {};
  }
}

function saveDismissed(map: Record<string, number>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
}

export function NotificationBell({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const [allNotifs, setAllNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Record<string, number>>({});
  const [collapsed, setCollapsed] = useState<Record<NotifCategory, boolean>>({
    DRIVER_OPS: false, COMPLAINTS: false, VEHICLES: false, PAYMENTS: false, OTHER: false,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/analytics/overview');
      const data = res.data;
      const list: Notif[] = [];

      if (data.alerts.failedRefunds > 0) {
        list.push({
          id: `failed-refunds-${data.alerts.failedRefunds}`,
          type: 'CRITICAL',
          category: 'PAYMENTS',
          title: `${data.alerts.failedRefunds} iade başarısız`,
          description: 'Iyzico üzerinden otomatik iade yapılamadı. Manuel müdahale gerekli.',
          tab: 'bookings',
          icon: RotateCcw,
        });
      }

      data.alerts.expiredVehicles.forEach((v: any) => {
        list.push({
          id: `expired-${v.id}`,
          type: 'CRITICAL',
          category: 'VEHICLES',
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
          category: 'VEHICLES',
          title: `${v.plate} yaklaşıyor`,
          description: `${days} gün içinde muayene/sigorta yenilemesi lazım.`,
          tab: 'vehicles',
          icon: Clock,
        });
      });

      (data.alerts.recentComplaints || []).forEach((c: any) => {
        const isUrgent = c.priority === 'HIGH' || c.priority === 'URGENT';
        list.push({
          id: `complaint-${c.id}`,
          type: isUrgent ? 'CRITICAL' : 'WARNING',
          category: 'COMPLAINTS',
          title: c.subject?.length > 60 ? c.subject.slice(0, 57) + '...' : (c.subject || 'Yeni şikayet'),
          description: `${c.contactName || 'Yolcu'} · ${categoryLabel(c.category)}${isUrgent ? ' · ' + priorityLabel(c.priority) : ''}`,
          tab: 'feedback',
          icon: isUrgent ? ShieldAlert : MessageSquareWarning,
        });
      });

      // Şoför operasyonları (DRIVER_OPS) — SOS/masraf/pre-trip
      const sosCount = data.alerts.recentSosCount || 0;
      if (sosCount > 0) {
        list.push({
          id: `sos-${sosCount}`,
          type: 'CRITICAL',
          category: 'DRIVER_OPS',
          title: `${sosCount} SOS olayı (24 saat)`,
          description: 'Şoförler acil durum tetikledi — konum ve detay için panele bak.',
          tab: 'driver-sos',
          icon: AlertTriangle,
        });
      }
      const pendingExp = data.alerts.pendingExpensesCount || 0;
      if (pendingExp > 0) {
        list.push({
          id: `expense-${pendingExp}`,
          type: 'WARNING',
          category: 'DRIVER_OPS',
          title: `${pendingExp} bekleyen masraf`,
          description: 'Şoför yol masraflarını onayla / reddet.',
          tab: 'driver-expenses',
          icon: AlertTriangle,
        });
      }
      const preTripIssues = data.alerts.preTripIssuesCount || 0;
      if (preTripIssues > 0) {
        list.push({
          id: `pretrip-${preTripIssues}`,
          type: 'WARNING',
          category: 'DRIVER_OPS',
          title: `${preTripIssues} araç kontrol eksiği (24 saat)`,
          description: 'Sefer öncesi kontrolde sorun raporlandı — bakım gerekebilir.',
          tab: 'pre-trip-checks',
          icon: AlertTriangle,
        });
      }

      const openCount = data.alerts.openComplaintsCount || 0;
      const shownCount = (data.alerts.recentComplaints || []).length;
      if (openCount > shownCount) {
        const remaining = openCount - shownCount;
        list.push({
          id: `complaints-more-${remaining}`,
          type: (data.alerts.urgentComplaintsCount || 0) > 0 ? 'CRITICAL' : 'WARNING',
          category: 'COMPLAINTS',
          title: `${remaining} açık şikayet daha`,
          description: 'Tümünü görüntülemek için şikayetler sekmesine git.',
          tab: 'feedback',
          icon: MessageSquareWarning,
        });
      }

      setAllNotifs(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDismissed(loadDismissed());
    load();
  }, [load]);
  useVisibleInterval(load, 60000);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dismiss = (id: string) => {
    const next = { ...dismissed, [id]: Date.now() };
    setDismissed(next);
    saveDismissed(next);
  };

  const dismissAll = () => {
    const now = Date.now();
    const next = { ...dismissed };
    for (const n of visible) next[n.id] = now;
    setDismissed(next);
    saveDismissed(next);
  };

  const visible = useMemo(
    () => allNotifs.filter((n) => !dismissed[n.id]),
    [allNotifs, dismissed],
  );

  const grouped = useMemo(() => {
    const buckets: Record<NotifCategory, Notif[]> = {
      COMPLAINTS: [], DRIVER_OPS: [], VEHICLES: [], PAYMENTS: [], OTHER: [],
    };
    // Defensive: bilinmeyen kategori gelirse OTHER'a düşür (ekleme zamanında senkron olmayabilir)
    for (const n of visible) {
      const bucket = buckets[n.category] || buckets.OTHER;
      bucket.push(n);
    }
    return buckets;
  }, [visible]);

  const criticalCount = visible.filter(n => n.type === 'CRITICAL').length;
  const totalCount = visible.length;

  const handleClickNotif = (n: Notif) => {
    dismiss(n.id);
    setOpen(false);
    onNavigate?.(n.tab);
  };

  const toggleCollapse = (cat: NotifCategory) => {
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));
  };

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
            className="absolute right-0 top-12 w-[420px] max-w-[92vw] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white">Bildirimler</h3>
                {totalCount > 0 && (
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {totalCount}
                  </span>
                )}
              </div>
              {totalCount > 0 && (
                <button
                  onClick={dismissAll}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tümünü okundu
                </button>
              )}
            </div>

            <div className="max-h-[480px] overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-400">Yükleniyor...</div>
              ) : totalCount === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Her şey yolunda</p>
                  <p className="text-[11px] font-semibold text-zinc-400 mt-1">Acil müdahale gerektiren durum yok</p>
                </div>
              ) : (
                <div>
                  {CATEGORY_ORDER.map((cat) => {
                    const items = grouped[cat];
                    if (items.length === 0) return null;
                    const meta = CATEGORY_META[cat];
                    const CatIcon = meta.icon;
                    const isCollapsed = collapsed[cat];
                    const catCritical = items.some((i) => i.type === 'CRITICAL');
                    return (
                      <div key={cat} className="border-b last:border-b-0 border-zinc-100 dark:border-zinc-800">
                        <button
                          onClick={() => toggleCollapse(cat)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          {isCollapsed ? <ChevronRight className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${TONE_CLASS[meta.tone]}`}>
                            <CatIcon className="w-3 h-3" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">{meta.label}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ml-auto ${catCritical ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                            {items.length}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {items.map(n => (
                                  <div key={n.id} className="group flex items-start gap-2 pl-8 pr-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <button
                                      onClick={() => handleClickNotif(n)}
                                      className="flex-1 flex items-start gap-3 text-left min-w-0"
                                    >
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        n.type === 'CRITICAL' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      }`}>
                                        <n.icon className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{n.title}</p>
                                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{n.description}</p>
                                      </div>
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                                      className="opacity-0 group-hover:opacity-100 shrink-0 text-[10px] font-bold text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                                      title="Okundu olarak işaretle"
                                    >
                                      Okundu
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
