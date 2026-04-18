"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, User, Phone, Mail, Calendar, Star, FileText,
  Bus, Wallet, AlertTriangle, Clipboard, Check, AlertCircle,
  Droplet, HeartPulse, MapPin,
} from "lucide-react";
import api from "@/lib/api";

interface Props {
  driverId: string | null;
  onClose: () => void;
}

const DOC_LABEL: Record<string, string> = {
  LICENSE: 'Ehliyet', SRC1: 'SRC1', SRC2: 'SRC2', SRC3: 'SRC3', SRC4: 'SRC4',
  PSYCHOTECH: 'Psikoteknik', HEALTH_REPORT: 'Sağlık Raporu', CRIMINAL_RECORD: 'Adli Sicil',
};

type TabKey = 'overview' | 'documents' | 'trips' | 'finance' | 'incidents' | 'reviews';

export function DriverDetailModal({ driverId, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (!driverId) return;
    setLoading(true);
    setTab('overview');
    api.get(`/driver-ops/admin/drivers/${driverId}/profile`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [driverId]);

  if (!driverId) return null;

  const u = data?.user;
  const p = data?.profile;
  const s = data?.stats || {};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {loading || !data ? (
            <div className="p-16 flex justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Hero */}
              <div className="p-6 bg-indigo-600 text-white relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/15 text-white">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center text-3xl font-black border border-white/20 shrink-0">
                    {u?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      u?.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-black tracking-tight">{u?.name}</h2>
                      {u?.suspendedAt && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500 px-2 py-0.5 rounded-full">ASKIDA</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm opacity-90 mt-1 flex-wrap">
                      {u?.email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {u.email}</span>}
                      {u?.phoneNumber && (
                        <a href={`tel:${u.phoneNumber}`} className="inline-flex items-center gap-1 hover:underline">
                          <Phone className="w-3.5 h-3.5" /> {u.phoneNumber}
                        </a>
                      )}
                    </div>
                    <p className="text-xs font-bold opacity-75 mt-1">
                      Kıdem: {u?.createdAt ? Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (365 * 86400000 / 12))  : 0} ay
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
                  <HeroStat icon={Bus} label="Sefer" value={s.completedTrips || 0} />
                  <HeroStat icon={Star} label="Puan" value={s.averageRating != null ? s.averageRating.toFixed(1) : '—'} />
                  <HeroStat icon={AlertTriangle} label="SOS" value={s.sosCount || 0} alert={s.sosCount > 0} />
                  <HeroStat icon={Clipboard} label="Uyum %" value={s.preTripComplianceRate != null ? `%${s.preTripComplianceRate}` : '—'} />
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center gap-1 overflow-x-auto shrink-0">
                {[
                  { k: 'overview' as TabKey, label: 'Genel' },
                  { k: 'documents' as TabKey, label: `Belgeler (${data.documents?.length || 0})` },
                  { k: 'trips' as TabKey, label: 'Son Seferler' },
                  { k: 'finance' as TabKey, label: 'Masraflar' },
                  { k: 'reviews' as TabKey, label: `Yorumlar (${s.reviewCount || 0})` },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                      tab === t.k ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {tab === 'overview' && (
                  <div className="space-y-4">
                    <InfoGrid
                      rows={[
                        { label: 'Doğum Tarihi', value: p?.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('tr-TR') : '—', icon: Calendar },
                        { label: 'Kan Grubu', value: p?.bloodType || '—', icon: Droplet },
                        { label: 'Şehir', value: p?.city || '—', icon: MapPin },
                        { label: 'Üniforma', value: p?.shirtSize || '—', icon: null },
                      ]}
                    />
                    {(p?.emergencyContactName || p?.emergencyContactPhone) && (
                      <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                          <HeartPulse className="w-3 h-3" /> Acil Durum Kontağı
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {p.emergencyContactName || '—'}
                          {p.emergencyContactRelation && <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium ml-2">· {p.emergencyContactRelation}</span>}
                        </p>
                        {p.emergencyContactPhone && (
                          <a href={`tel:${p.emergencyContactPhone}`} className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 hover:underline">
                            {p.emergencyContactPhone}
                          </a>
                        )}
                      </div>
                    )}
                    {u?.badges?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Rozetler</p>
                        <div className="flex flex-wrap gap-2">
                          {u.badges.map((b: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-black">
                              🏆 {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'documents' && (
                  <div className="space-y-2">
                    {data.documents?.length > 0 ? (
                      data.documents.map((d: any) => {
                        const validUntil = d.validUntil ? new Date(d.validUntil) : null;
                        const daysLeft = validUntil ? Math.ceil((validUntil.getTime() - Date.now()) / 86400000) : null;
                        const expired = daysLeft != null && daysLeft < 0;
                        const soon = daysLeft != null && daysLeft >= 0 && daysLeft <= 30;
                        return (
                          <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                            expired ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-500/5 dark:border-rose-500/40'
                            : soon ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-500/5 dark:border-amber-500/40'
                            : 'border-slate-200 dark:border-zinc-800'
                          }`}>
                            <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-black text-slate-900 dark:text-white">{DOC_LABEL[d.type] || d.type}</p>
                                {d.licenseClass && <span className="text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Sınıf {d.licenseClass}</span>}
                                {expired ? (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white">Süresi geçmiş</span>
                                ) : soon ? (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-white">{daysLeft}g kaldı</span>
                                ) : null}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                                {d.documentNumber && `No: ${d.documentNumber} · `}
                                {validUntil && `Bitiş: ${validUntil.toLocaleDateString('tr-TR')}`}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 font-medium py-8 text-center">Belge yok. Şoför kendi profilinden ekleyebilir.</p>
                    )}
                  </div>
                )}

                {tab === 'trips' && (
                  <div className="space-y-2">
                    {data.recentTrips?.length > 0 ? (
                      data.recentTrips.map((t: any) => (
                        <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                          <Bus className="w-5 h-5 text-indigo-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{t.route}</p>
                              <StatusPill status={t.status} />
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                              {new Date(t.departureTime).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {t.plate} · {t.passengers} yolcu
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-medium py-8 text-center">Henüz sefer yok.</p>
                    )}
                  </div>
                )}

                {tab === 'finance' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Toplam Masraf</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">₺{s.totalExpenseAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{s.totalExpenseCount || 0} kayıt</p>
                      </div>
                      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Pre-trip Uyum</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                          {s.preTripComplianceRate != null ? `%${s.preTripComplianceRate}` : '—'}
                        </p>
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                          {s.preTripCount || 0} kontrol · {s.preTripIssueCount || 0} eksik
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium italic text-center">
                      Detaylı masraf listesi için "Masraf Onayları" sekmesine git.
                    </p>
                  </div>
                )}

                {tab === 'reviews' && (
                  <div className="space-y-2">
                    {data.recentReviews?.length > 0 ? (
                      data.recentReviews.map((r: any) => (
                        <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-zinc-700'}`} />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(r.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {r.comment && <p className="text-sm text-slate-700 dark:text-zinc-300 font-medium italic">"{r.comment}"</p>}
                          {r.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {r.tags.map((t: string, i: number) => (
                                <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-medium py-8 text-center">Henüz yorum yok.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function HeroStat({ icon: Icon, label, value, alert }: { icon: any; label: string; value: any; alert?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${alert ? 'bg-rose-500/30 border-rose-300' : 'bg-white/15 backdrop-blur-sm border-white/20'}`}>
      <Icon className="w-4 h-4 opacity-80 mb-1" />
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
      <p className="text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function InfoGrid({ rows }: { rows: { label: string; value: string; icon: any }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {rows.map((r, i) => (
        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-1">
            {r.icon && <r.icon className="w-3 h-3" />} {r.label}
          </p>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{r.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PLANNED: { label: 'Planlandı', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
    ACTIVE: { label: 'Aktif', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    COMPLETED: { label: 'Tamamlandı', cls: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400' },
    CANCELLED: { label: 'İptal', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
  };
  const m = map[status] || map.COMPLETED;
  return <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${m.cls}`}>{m.label}</span>;
}
