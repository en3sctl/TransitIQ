"use client";

import { useEffect, useState } from "react";
import { Loader2, LogOut, Monitor, Smartphone, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string;
}

export function SecuritySessionsPanel() {
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/security/sessions');
      setItems(res.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Cihazı Çıkar',
      message: 'Bu cihazdaki oturum sonlandırılacak, yeniden giriş yapması gerekecek.',
      variant: 'warning',
      confirmLabel: 'Çıkar',
    });
    if (!ok) return;
    try {
      await api.delete(`/security/sessions/${id}`);
      toast.success('Cihaz çıkarıldı');
      load();
    } catch { toast.error('İşlem başarısız'); }
  };

  const revokeAll = async () => {
    const ok = await confirmDialog({
      title: 'Tüm Cihazları Çıkar',
      message: 'Tüm cihazlardaki oturumlar sonlandırılır. Bu cihazın oturumu da dahil olabilir.',
      variant: 'danger',
      confirmLabel: 'Hepsini Çıkar',
    });
    if (!ok) return;
    try {
      await api.post('/security/sessions/revoke-all', {});
      toast.success('Tüm oturumlar sonlandırıldı');
      load();
    } catch { toast.error('İşlem başarısız'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Aktif Oturumlar</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Hesabında giriş yapılmış tüm cihazlar.</p>
        </div>
        {items.length > 0 && (
          <button onClick={revokeAll} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100">
            <LogOut className="w-3.5 h-3.5" /> Tüm Cihazları Çıkış Yap
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Aktif oturum takip edilmiyor</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Yeni girişler bu listede görünecek.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => {
            const isMobile = /Mobile|Android|iPhone/i.test(s.userAgent || '');
            const Icon = isMobile ? Smartphone : Monitor;
            return (
              <div key={s.id} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {s.userAgent || 'Bilinmeyen cihaz'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5 flex items-center gap-3 flex-wrap">
                    {s.ipAddress && <span>IP: {s.ipAddress}</span>}
                    <span>Son aktivite: {new Date(s.lastSeenAt).toLocaleString('tr-TR')}</span>
                    <span>Giriş: {new Date(s.createdAt).toLocaleDateString('tr-TR')}</span>
                  </p>
                </div>
                <button onClick={() => revoke(s.id)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold shrink-0">
                  <Trash2 className="w-3 h-3" /> Çıkış
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
