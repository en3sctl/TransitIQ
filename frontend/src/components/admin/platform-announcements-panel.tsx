"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, Trash2, Eye, EyeOff, Loader2, Calendar, Users as UsersIcon, AlertTriangle, Info, AlertOctagon, X, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'ALL' | 'COMPANY_ADMINS' | 'PASSENGERS' | 'DRIVERS';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  linkUrl: string | null;
  linkLabel: string | null;
  startsAt: string;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
}

const SEVERITY_META: Record<string, { icon: any; tone: string; label: string }> = {
  INFO: { icon: Info, tone: 'indigo', label: 'Bilgi' },
  WARNING: { icon: AlertTriangle, tone: 'amber', label: 'Uyarı' },
  CRITICAL: { icon: AlertOctagon, tone: 'rose', label: 'Kritik' },
};
const AUDIENCE_LABELS: Record<string, string> = {
  ALL: 'Herkes',
  COMPANY_ADMINS: 'Firma Adminleri',
  PASSENGERS: 'Yolcular',
  DRIVERS: 'Şoförler',
};
const TONE: Record<string, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
};

export function PlatformAnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', body: '', audience: 'ALL', severity: 'INFO',
    linkUrl: '', linkLabel: '', endsAt: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/announcements');
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Başlık ve içerik gerekli');
      return;
    }
    try {
      await api.post('/super-admin/announcements', {
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        severity: form.severity,
        linkUrl: form.linkUrl || undefined,
        linkLabel: form.linkLabel || undefined,
        endsAt: form.endsAt || undefined,
      });
      toast.success('Duyuru yayınlandı');
      setEditOpen(false);
      setForm({ title: '', body: '', audience: 'ALL', severity: 'INFO', linkUrl: '', linkLabel: '', endsAt: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi');
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await api.patch(`/super-admin/announcements/${a.id}`, { active: !a.active });
      load();
    } catch {
      toast.error('Güncellenemedi');
    }
  };

  const remove = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Duyuruyu sil',
      message: 'Bu duyuru tamamen silinecek. Onaylıyor musun?',
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!ok) return;
    try {
      await api.delete(`/super-admin/announcements/${id}`);
      toast.success('Silindi');
      load();
    } catch {
      toast.error('Silinemedi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
          <Megaphone className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">{items.length} duyuru</span>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Duyuru
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Henüz duyuru yok</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Platform duyurusu oluştur, tüm firmalara / yolculara banner olarak gösterilsin.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const meta = SEVERITY_META[a.severity];
            const Icon = meta.icon;
            const isExpired = a.endsAt && new Date(a.endsAt) < new Date();
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-2xl p-4 ${TONE[meta.tone]} ${!a.active || isExpired ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-black">{a.title}</h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/10 dark:bg-white/10">
                        <UsersIcon className="w-2.5 h-2.5" /> {AUDIENCE_LABELS[a.audience]}
                      </span>
                      {!a.active && <span className="text-[9px] font-black uppercase">PASİF</span>}
                      {isExpired && <span className="text-[9px] font-black uppercase">SÜRESİ DOLDU</span>}
                    </div>
                    <p className="text-xs font-medium opacity-90 whitespace-pre-wrap">{a.body}</p>
                    {a.linkUrl && (
                      <a href={a.linkUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[11px] font-bold underline">
                        {a.linkLabel || a.linkUrl}
                      </a>
                    )}
                    <p className="text-[10px] font-bold opacity-70 mt-2 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />Başlangıç: {new Date(a.startsAt).toLocaleString('tr-TR')}</span>
                      {a.endsAt && <span className="inline-flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />Bitiş: {new Date(a.endsAt).toLocaleString('tr-TR')}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(a)} className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10" title={a.active ? 'Gizle' : 'Aktif et'}>
                      {a.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10" title="Sil">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New announcement modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-black">Yeni Duyuru</h3>
              <button onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Başlık</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">İçerik</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={4}
                  maxLength={4000}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Hedef kitle</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold"
                  >
                    {Object.entries(AUDIENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Önem</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold"
                  >
                    <option value="INFO">Bilgi</option>
                    <option value="WARNING">Uyarı</option>
                    <option value="CRITICAL">Kritik</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Link URL (ops.)</label>
                  <input
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Link etiketi</label>
                  <input
                    value={form.linkLabel}
                    onChange={(e) => setForm({ ...form, linkLabel: e.target.value })}
                    placeholder="Detayları gör"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Bitiş tarihi (ops.)</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">İptal</button>
              <button onClick={create} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                <Save className="w-3.5 h-3.5" /> Yayınla
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
