"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, BadgeCheck, Pause, Play, ShieldCheck, Percent, ExternalLink, Search, UserCog } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Tenant {
  id: string;
  name: string;
  publicName: string | null;
  slug: string;
  domain: string | null;
  status: string;
  logoUrl: string | null;
  verifiedAt: string | null;
  commissionRate: number;
  iyzicoMode: string;
  createdAt: string;
  _count: { users: number; vehicles: number; routes: number; bookings: number };
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}
function toAbsolute(url: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : apiBase() + url;
}

export function SuperTenantsPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/tenants');
      setTenants(res.data || []);
    } catch (err: any) {
      if (err.response?.status === 403) toast.error('Bu panele sadece süper admin erişebilir');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING') => {
    try {
      await api.patch(`/super-admin/tenants/${id}/status`, { status });
      toast.success(`Durum güncellendi: ${status}`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Güncellenemedi');
    }
  };

  const impersonate = async (id: string, name: string) => {
    if (!confirm(`"${name}" firmasının admin panelinde oturum açılacak. Tüm aksiyonlar denetim logunda kaydedilir. Devam?`)) return;
    try {
      const res = await api.post(`/super-admin/tenants/${id}/impersonate`, {});
      const { token, user } = res.data;
      // Save current super-admin session for restoration
      const currentToken = localStorage.getItem('token');
      const currentUser = localStorage.getItem('user');
      if (currentToken && currentUser) {
        localStorage.setItem('super_admin_token', currentToken);
        localStorage.setItem('super_admin_user', currentUser);
      }
      // Swap to impersonated session
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`${name} olarak giriş yapıldı (30 dk geçerli)`);
      // Hard reload so all context/state resets
      window.location.href = '/admin';
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Impersonate başarısız');
    }
  };

  const verify = async (id: string) => {
    try {
      await api.patch(`/super-admin/tenants/${id}/verify`, {});
      toast.success('Firma doğrulandı');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Doğrulanamadı');
    }
  };

  const setCommission = async (id: string) => {
    const raw = prompt('Yeni komisyon oranı (0-0.5 arası, örn: 0.08 = %8):');
    if (raw === null) return;
    const rate = Number(raw);
    if (isNaN(rate) || rate < 0 || rate > 0.5) {
      toast.error('Geçersiz oran');
      return;
    }
    try {
      await api.patch(`/super-admin/tenants/${id}/commission`, { rate });
      toast.success('Komisyon oranı güncellendi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Güncellenemedi');
    }
  };

  const filtered = tenants.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.publicName || '').toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.domain || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Firma ara (isim, slug, domain)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          {['', 'ACTIVE', 'PENDING', 'SUSPENDED'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {s || 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Firma bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((t, i) => {
            const logo = toAbsolute(t.logoUrl);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex gap-4"
              >
                {logo ? (
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt={t.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shrink-0">
                    {(t.publicName || t.name)[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {t.publicName || t.name}
                    </h4>
                    {t.verifiedAt && <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : t.status === 'PENDING'
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
                    /{t.slug} · {t.iyzicoMode === 'OWN' ? '🏦 Kendi Iyzico' : '🏢 Platform'} · %{Math.round(t.commissionRate * 100 * 10) / 10} komisyon
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                    <span>{t._count.users} kullanıcı</span>
                    <span>·</span>
                    <span>{t._count.vehicles} araç</span>
                    <span>·</span>
                    <span>{t._count.routes} rota</span>
                    <span>·</span>
                    <span>{t._count.bookings} bilet</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {t.status !== 'ACTIVE' && (
                      <button
                        onClick={() => updateStatus(t.id, 'ACTIVE')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                      >
                        <Play className="w-3 h-3" /> Aktif Yap
                      </button>
                    )}
                    {t.status === 'ACTIVE' && (
                      <button
                        onClick={() => updateStatus(t.id, 'SUSPENDED')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100"
                      >
                        <Pause className="w-3 h-3" /> Askıya Al
                      </button>
                    )}
                    {!t.verifiedAt && (
                      <button
                        onClick={() => verify(t.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 hover:bg-sky-100"
                      >
                        <ShieldCheck className="w-3 h-3" /> Doğrula
                      </button>
                    )}
                    <button
                      onClick={() => setCommission(t.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100"
                    >
                      <Percent className="w-3 h-3" /> Komisyon
                    </button>
                    <button
                      onClick={() => impersonate(t.id, t.publicName || t.name)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100"
                      title="Bu firma olarak oturum aç (destek için)"
                    >
                      <UserCog className="w-3 h-3" /> Giriş Yap
                    </button>
                    <a
                      href={`/firma/${t.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                    >
                      <ExternalLink className="w-3 h-3" /> Profil
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
