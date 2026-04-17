"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Ban, UserCheck, KeyRound, ShieldAlert, Copy, Ticket, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { alertDialog, confirmDialog, promptDialog } from "@/components/ui/dialogs";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  suspendedAt: string | null;
  suspendedReason: string | null;
  tenant: { id: string; name: string; publicName: string | null; slug: string } | null;
  _count: { bookings: number };
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'purple',
  COMPANY_ADMIN: 'indigo',
  OPERATOR: 'sky',
  DRIVER: 'amber',
  PASSENGER: 'slate',
};
const TONE: Record<string, string> = {
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
};

export function PlatformUsersPanel() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [suspended, setSuspended] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/users', {
        params: {
          q: query.trim() || undefined,
          role: role || undefined,
          suspended: suspended || undefined,
          take: 100,
        },
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, role, suspended]);

  const suspend = async (u: UserItem) => {
    const reason = await promptDialog({
      title: `${u.name} — Askıya Al`,
      message: 'Kullanıcı platformda işlem yapamaz. Sebep denetim logunda kaydedilir.',
      label: 'Askıya alma sebebi',
      placeholder: 'Örn: Çoklu hesap açma, KVKK ihlali, dolandırıcılık şüphesi...',
      type: 'textarea',
      variant: 'danger',
      confirmLabel: 'Askıya Al',
      minLength: 3,
    });
    if (reason === null) return;
    try {
      await api.post(`/super-admin/users/${u.id}/suspend`, { reason });
      toast.success('Kullanıcı askıya alındı');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    }
  };

  const unsuspend = async (u: UserItem) => {
    try {
      await api.post(`/super-admin/users/${u.id}/unsuspend`, {});
      toast.success('Askı kaldırıldı');
      load();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const resetPassword = async (u: UserItem) => {
    const ok = await confirmDialog({
      title: `${u.name} — Parola Sıfırla`,
      message: 'Rastgele geçici bir parola üretilecek. Sana bir kere gösterilecek, kullanıcıya güvenli kanaldan ilet (WhatsApp değil). Devam?',
      variant: 'warning',
      confirmLabel: 'Sıfırla',
    });
    if (!ok) return;
    try {
      const res = await api.post(`/super-admin/users/${u.id}/reset-password`, {});
      const tempPwd = res.data?.tempPassword;
      if (tempPwd) {
        try { await navigator.clipboard.writeText(tempPwd); } catch { /* ignore */ }
        await alertDialog({
          title: 'Geçici Parola',
          message: `${tempPwd}\n\nPanoya kopyalandı. Kullanıcıya güvenli kanaldan ilet, bir daha gösterilmez.`,
          variant: 'success',
          confirmLabel: 'Aldım',
        });
      }
    } catch {
      toast.error('Sıfırlama başarısız');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim, e-posta ile ara..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:border-indigo-500 outline-none"
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold">
          <option value="">Tüm roller</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="COMPANY_ADMIN">Firma Admin</option>
          <option value="OPERATOR">Operatör</option>
          <option value="DRIVER">Şoför</option>
          <option value="PASSENGER">Yolcu</option>
        </select>
        <select value={suspended} onChange={(e) => setSuspended(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold">
          <option value="">Tümü</option>
          <option value="false">Aktif</option>
          <option value="true">Askıda</option>
        </select>
        <span className="text-[11px] font-bold text-slate-500 ml-auto">{items.length} / {total} kullanıcı</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Sonuç yok</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {items.map((u) => {
              const color = ROLE_COLORS[u.role] || 'slate';
              return (
                <div key={u.id} className={`p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 flex items-center gap-3 ${u.suspendedAt ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${TONE[color]}`}>
                    {u.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${TONE[color]}`}>{u.role}</span>
                      {u.suspendedAt && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest">
                          <ShieldAlert className="w-2.5 h-2.5" /> Askıda
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                      {u.tenant && <span className="inline-flex items-center gap-1">{u.tenant.publicName || u.tenant.name}</span>}
                      {u._count.bookings > 0 && <span className="inline-flex items-center gap-1"><Ticket className="w-3 h-3" />{u._count.bookings} bilet</span>}
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(u.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {u.suspendedReason && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-1">Sebep: {u.suspendedReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.suspendedAt ? (
                      <button onClick={() => unsuspend(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100">
                        <UserCheck className="w-3 h-3" /> Askıyı Kaldır
                      </button>
                    ) : (
                      <button onClick={() => suspend(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-100">
                        <Ban className="w-3 h-3" /> Askıya Al
                      </button>
                    )}
                    <button onClick={() => resetPassword(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-zinc-700">
                      <KeyRound className="w-3 h-3" /> Parola Sıfırla
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
