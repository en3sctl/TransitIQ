"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, FileCheck, FileX, Building2, Mail, Phone, Globe, MapPin, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface PendingTenant {
  id: string;
  name: string;
  publicName: string | null;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  website: string | null;
  address: string | null;
  taxId: string | null;
  mersisNo: string | null;
  uetdsLicense: string | null;
  aboutShort: string | null;
  createdAt: string;
  docsComplete: boolean;
  _count: { users: number };
}

function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }
function toAbs(u: string | null) { return u ? (u.startsWith('http') ? u : apiBase() + u) : null; }

export function PlatformApprovalsPanel() {
  const [items, setItems] = useState<PendingTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/tenants/pending');
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    if (!confirm('Bu firma onaylansın mı? Onay sonrası firma platformda satış yapmaya başlar.')) return;
    setActing(id);
    try {
      await api.post(`/super-admin/tenants/${id}/approve`, {});
      toast.success('Firma onaylandı');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Onaylama başarısız');
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Red sebebi (firma admin\'e iletilmez ama audit\'e kaydedilir):');
    if (reason === null) return;
    setActing(id);
    try {
      await api.post(`/super-admin/tenants/${id}/reject`, { reason });
      toast.success('Firma reddedildi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-900 dark:text-white">Onay bekleyen firma yok</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Yeni firmalar kayıt olduğunda burada görünür.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t, i) => {
            const logo = toAbs(t.logoUrl);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex items-start gap-4 mb-4">
                  {logo ? (
                    <div className="w-16 h-16 rounded-xl bg-white border overflow-hidden flex items-center justify-center p-1 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt={t.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-amber-500 flex items-center justify-center text-white text-2xl font-black shrink-0">
                      {(t.publicName || t.name)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">{t.publicName || t.name}</h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                        Beklemede
                      </span>
                      {t.docsComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <FileCheck className="w-3 h-3" /> Belge tam
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      /{t.slug} · {t._count.users} kullanıcı · Başvuru: {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                    {t.aboutShort && (
                      <p className="text-sm text-slate-700 dark:text-zinc-300 mt-2 font-medium">{t.aboutShort}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs mb-4 pl-20">
                  {t.supportEmail && <InfoRow icon={Mail} label={t.supportEmail} />}
                  {t.supportPhone && <InfoRow icon={Phone} label={t.supportPhone} />}
                  {t.website && <InfoRow icon={Globe} label={t.website} />}
                  {t.address && <InfoRow icon={MapPin} label={t.address} />}
                  {t.taxId && <InfoRow icon={FileText} label={`Vergi No: ${t.taxId}`} />}
                  {t.mersisNo && <InfoRow icon={FileText} label={`MERSİS: ${t.mersisNo}`} />}
                  {t.uetdsLicense && <InfoRow icon={FileText} label={`D Belgesi: ${t.uetdsLicense}`} />}
                </div>

                {!t.docsComplete && (
                  <div className="ml-20 mb-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/80 dark:border-amber-500/20 p-2.5 flex gap-2">
                    <FileX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      Firma belgelerini eksik bırakmış (Vergi No, MERSİS veya D-belgesi). Onaylamadan önce firmayla iletişime geç.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pl-20">
                  <button
                    onClick={() => approve(t.id)}
                    disabled={acting === t.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {acting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Onayla
                  </button>
                  <button
                    onClick={() => reject(t.id)}
                    disabled={acting === t.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reddet
                  </button>
                  <a
                    href={`/firma/${t.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700"
                  >
                    <ExternalLink className="w-3 h-3" /> Profil
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 font-medium">
      <Icon className="w-3 h-3 shrink-0 text-slate-400" />
      <span className="truncate">{label}</span>
    </div>
  );
}
