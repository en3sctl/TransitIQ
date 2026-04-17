"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, Trash2, Check, X, Clock, Mail, AlertTriangle, FileText, UserX } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog, promptDialog } from "@/components/ui/dialogs";

interface DataRequest {
  id: string;
  userId: string | null;
  contactEmail: string;
  contactName: string;
  type: 'EXPORT' | 'DELETE' | 'CORRECT' | 'RESTRICT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  reason: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = { EXPORT: 'Veri İndirme', DELETE: 'Silme', CORRECT: 'Düzeltme', RESTRICT: 'Kısıtlama' };
const STATUS_LABELS: Record<string, string> = { PENDING: 'Bekliyor', IN_PROGRESS: 'İncelemede', COMPLETED: 'Tamamlandı', REJECTED: 'Reddedildi' };
const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  IN_PROGRESS: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400',
  COMPLETED: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  REJECTED: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
};
const TYPE_ICON: Record<string, any> = { EXPORT: Download, DELETE: Trash2, CORRECT: FileText, RESTRICT: UserX };

export function PlatformKvkkPanel() {
  const [items, setItems] = useState<DataRequest[]>([]);
  const [stats, setStats] = useState<any>({ pending: 0, inProgress: 0, completed: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/kvkk-requests', { params: { status: statusFilter || undefined } });
      setItems(res.data?.items || []);
      setStats(res.data?.stats || stats);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);

  const updateStatus = async (id: string, status: string, resolution?: string) => {
    try {
      await api.patch(`/super-admin/kvkk-requests/${id}`, { status, resolution });
      toast.success('Güncellendi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    }
  };

  const exportData = async (id: string, email: string) => {
    try {
      const res = await api.get(`/super-admin/kvkk-requests/${id}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kvkk-export-${email}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const note = await promptDialog({
        title: 'Dışa Aktarma Notu',
        message: 'Kullanıcıya e-posta olarak iletilir. Çözüm sürecini anlat.',
        label: 'Not',
        type: 'textarea',
        defaultValue: 'Veriniz JSON olarak dışa aktarıldı, size güvenli kanalla iletilecek.',
        confirmLabel: 'Tamamlandı İşaretle',
      });
      await updateStatus(id, 'COMPLETED', note || 'Veri dışa aktarıldı');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Export başarısız');
    }
  };

  const executeDelete = async (id: string, email: string) => {
    const ok = await confirmDialog({
      title: 'Veri Silme Onayı',
      message: `${email} için TÜM kişisel veriler anonimize edilecek.\n\n• Kullanıcı kaydı: "Silinmiş Kullanıcı" yapılır\n• Bilet geçmişi: maskelenir (yasal kayıt saklanır)\n• Cüzdan, rozet, fiyat alarmları silinir\n\nBu işlem GERİ ALINAMAZ. Devam?`,
      variant: 'danger',
      confirmLabel: 'Verileri Sil',
    });
    if (!ok) return;
    try {
      const res = await api.post(`/super-admin/kvkk-requests/${id}/execute`, {});
      toast.success(`${res.data.deleted} kullanıcı silindi/anonimize edildi`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Silme başarısız');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Bekleyen" count={stats.pending} tone="amber" onClick={() => setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING')} active={statusFilter === 'PENDING'} />
        <StatTile label="İncelemede" count={stats.inProgress} tone="sky" onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')} active={statusFilter === 'IN_PROGRESS'} />
        <StatTile label="Tamamlanan" count={stats.completed} tone="emerald" onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? '' : 'COMPLETED')} active={statusFilter === 'COMPLETED'} />
        <StatTile label="Reddedilen" count={stats.rejected} tone="rose" onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? '' : 'REJECTED')} active={statusFilter === 'REJECTED'} />
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-3 flex gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
          <strong>KVKK zorunluluk:</strong> Yolcu veri talebi geldikten sonra <strong>30 gün içinde</strong> cevap verilmeli. Silme işlemi veriyi anonimize eder (yasal kayıt tutma için bilet bilgileri maskelenmiş olarak kalır).
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Talep yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const Icon = TYPE_ICON[r.type];
            const daysAgo = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const urgent = daysAgo >= 20 && (r.status === 'PENDING' || r.status === 'IN_PROGRESS');
            return (
              <div key={r.id} className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 ${urgent ? 'border-rose-300 dark:border-rose-500/40' : 'border-slate-200/80 dark:border-zinc-800'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${STATUS_TONE[r.status]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{TYPE_LABELS[r.type]}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_TONE[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                      {urgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest">
                          <AlertTriangle className="w-2.5 h-2.5" /> {daysAgo} gün · Acil
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                      <Mail className="w-3 h-3 inline mr-1" /> {r.contactEmail} · {r.contactName}
                    </p>
                    {r.reason && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-1 italic">"{r.reason}"</p>
                    )}
                    {r.resolution && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        <Check className="w-3 h-3 inline mr-0.5" /> {r.resolution}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 font-semibold mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(r.createdAt).toLocaleString('tr-TR')}
                      {r.resolvedAt && ` · Çözüldü: ${new Date(r.resolvedAt).toLocaleDateString('tr-TR')}`}
                    </p>
                  </div>
                  {(r.status === 'PENDING' || r.status === 'IN_PROGRESS') && (
                    <div className="flex flex-col gap-1 shrink-0">
                      {r.type === 'EXPORT' && (
                        <button onClick={() => exportData(r.id, r.contactEmail)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold">
                          <Download className="w-3 h-3" /> Dışa Aktar
                        </button>
                      )}
                      {r.type === 'DELETE' && (
                        <button onClick={() => executeDelete(r.id, r.contactEmail)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold">
                          <Trash2 className="w-3 h-3" /> Sil
                        </button>
                      )}
                      <button onClick={() => updateStatus(r.id, 'IN_PROGRESS')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px] font-bold">
                        İnceleme
                      </button>
                      <button
                        onClick={async () => {
                          const reason = await promptDialog({
                            title: 'Talebi Reddet',
                            message: 'KVKK talebini reddetmenin yasal bir sebebi olmalı (kimlik doğrulanamadı, zaten silinmiş, vs.).',
                            label: 'Red sebebi',
                            type: 'textarea',
                            variant: 'danger',
                            confirmLabel: 'Reddet',
                            minLength: 5,
                          });
                          if (reason !== null) updateStatus(r.id, 'REJECTED', reason);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold"
                      >
                        <X className="w-3 h-3" /> Reddet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, count, tone, onClick, active }: any) {
  const toneMap: Record<string, string> = {
    amber: 'text-amber-600 dark:text-amber-400',
    sky: 'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left transition-all ${active ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-zinc-800'} bg-white dark:bg-zinc-900`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
      <p className={`text-3xl font-black tracking-tight mt-1 ${toneMap[tone]}`}>{count}</p>
    </button>
  );
}
