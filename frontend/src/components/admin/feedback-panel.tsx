"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Star, AlertTriangle, CheckCircle2, Clock, X, Loader2,
  Eye, EyeOff, Mail, Phone, Send, Inbox, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

type TabKey = 'complaints' | 'reviews';

interface Complaint {
  id: string;
  userId: string | null;
  bookingId: string | null;
  contactEmail: string;
  contactName: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface Review {
  id: string;
  bookingId: string;
  userId: string;
  tripId: string;
  driverId: string | null;
  rating: number;
  comment: string | null;
  tags: string[];
  hidden: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  DELAY: 'Gecikme', DRIVER: 'Şoför', CLEANLINESS: 'Temizlik',
  PAYMENT: 'Ödeme', SEAT: 'Koltuk', OTHER: 'Diğer',
};

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  OPEN: { label: 'Açık', cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50', icon: Inbox },
  IN_PROGRESS: { label: 'İşlemde', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50', icon: Clock },
  RESOLVED: { label: 'Çözüldü', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50', icon: CheckCircle2 },
  DISMISSED: { label: 'Reddedildi', cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700', icon: X },
};

const PRIORITY_CLS: Record<string, string> = {
  URGENT: 'bg-rose-600 text-white',
  HIGH: 'bg-rose-500 text-white',
  NORMAL: 'bg-zinc-400 text-white',
  LOW: 'bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
};

const TAG_LABELS: Record<string, string> = {
  CLEAN: '🧼 Temiz', ON_TIME: '⏰ Vaktinde', FRIENDLY: '😊 Güler yüzlü',
  COMFORTABLE: '💺 Rahat', RUDE: '😠 Kaba', LATE: '🐌 Geç', DIRTY: '🗑️ Kirli', VALUE: '💰 Uygun fiyat',
};

function fDate(s: string) {
  return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa`;
  return `${Math.floor(h / 24)}g`;
}

export function FeedbackPanel() {
  const [tab, setTab] = useState<TabKey>('complaints');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
        {([
          { k: 'complaints' as TabKey, label: 'Şikayetler', icon: MessageSquare },
          { k: 'reviews' as TabKey, label: 'Yorumlar', icon: Star },
        ]).map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              tab === t.k ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'complaints' ? <ComplaintsView /> : <ReviewsView />}
    </div>
  );
}

function ComplaintsView() {
  const [data, setData] = useState<{ complaints: Complaint[]; total: number; stats: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { take: 100 };
      if (statusFilter) params.status = statusFilter;
      const r = await api.get('/admin/complaints', { params });
      setData(r.data);
    } catch { toast.error('Şikayetler yüklenemedi'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip icon={Inbox} label="Açık" value={data?.stats.open || 0} color="rose" />
        <StatChip icon={Clock} label="İşlemde" value={data?.stats.inProgress || 0} color="amber" />
        <StatChip icon={CheckCircle2} label="Çözüldü" value={data?.stats.resolved || 0} color="emerald" />
        <StatChip icon={X} label="Reddedilen" value={data?.stats.dismissed || 0} color="zinc" />
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { v: '', label: 'Tümü' },
            { v: 'OPEN', label: 'Açık' },
            { v: 'IN_PROGRESS', label: 'İşlemde' },
            { v: 'RESOLVED', label: 'Çözüldü' },
            { v: 'DISMISSED', label: 'Reddedilen' },
          ].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f.v ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}>{f.label}</button>
          ))}
          <span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase tracking-widest self-center">{data?.total || 0} kayıt</span>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : !data?.complaints.length ? (
          <div className="py-20 text-center">
            <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-500">Şikayet yok</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.complaints.map(c => {
              const st = STATUS_MAP[c.status] || STATUS_MAP.OPEN;
              return (
                <button key={c.id} onClick={() => setSelected(c)} className="w-full flex items-start gap-4 p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors text-left">
                  <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_CLS[c.priority] || PRIORITY_CLS.NORMAL}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{c.subject}</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">{c.description}</p>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                      {c.contactName} · {c.contactEmail} · {timeAgo(c.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <ComplaintDetail complaint={selected} onClose={() => { setSelected(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ComplaintDetail({ complaint, onClose }: { complaint: Complaint; onClose: () => void }) {
  const [form, setForm] = useState({
    status: complaint.status,
    priority: complaint.priority,
    resolution: complaint.resolution || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/complaints/${complaint.id}`, form);
      toast.success('Şikayet güncellendi');
      onClose();
    } catch { toast.error('Güncellenemedi'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {CATEGORY_LABELS[complaint.category]}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${PRIORITY_CLS[complaint.priority] || PRIORITY_CLS.NORMAL}`}>
                {complaint.priority}
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">{complaint.subject}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Ad</p>
                <p className="font-bold text-zinc-900 dark:text-white truncate">{complaint.contactName}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Email</p>
                <p className="font-bold text-zinc-900 dark:text-white truncate">{complaint.contactEmail}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Şikayet</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">{complaint.description}</p>
          </div>

          {complaint.bookingId && (
            <p className="text-[10px] font-semibold text-zinc-400">Bilet ID: <code className="font-mono">{complaint.bookingId.slice(0, 8)}</code></p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Durum</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                <option value="OPEN">Açık</option>
                <option value="IN_PROGRESS">İşlemde</option>
                <option value="RESOLVED">Çözüldü</option>
                <option value="DISMISSED">Reddedildi</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Öncelik</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none">
                <option value="LOW">Düşük</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Yüksek</option>
                <option value="URGENT">Acil</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Çözüm Notu (iç kullanım)</label>
            <textarea value={form.resolution} onChange={e => setForm({...form, resolution: e.target.value})}
              rows={3} placeholder="Ne yapıldı, nasıl çözüldü..."
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">İptal</button>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewsView() {
  const [data, setData] = useState<{ reviews: Review[]; total: number; averageRating: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [minRating, setMinRating] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { take: 100 };
      if (minRating) params.minRating = minRating;
      const r = await api.get('/admin/reviews', { params });
      setData(r.data);
    } catch { toast.error('Yorumlar yüklenemedi'); }
    finally { setLoading(false); }
  }, [minRating]);

  useEffect(() => { load(); }, [load]);

  const toggleHidden = async (id: string) => {
    try { await api.patch(`/admin/reviews/${id}/toggle-hidden`); load(); }
    catch { toast.error('Güncellenemedi'); }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatChip icon={Star} label="Ortalama Puan" value={data?.averageRating || 0} color="amber" suffix=" / 5" />
        <StatChip icon={MessageSquare} label="Toplam Yorum" value={data?.total || 0} color="indigo" />
        <StatChip icon={EyeOff} label="Gizlenen" value={data?.reviews.filter(r => r.hidden).length || 0} color="zinc" />
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Min puan:</span>
          {['', '1', '2', '3', '4', '5'].map(r => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                minRating === r ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200'
              }`}>{r || 'Hepsi'}{r && '★+'}</button>
          ))}
          <span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{data?.total || 0} yorum</span>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : !data?.reviews.length ? (
          <div className="py-20 text-center">
            <Star className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-500">Yorum yok</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.reviews.map(r => (
              <div key={r.id} className={`p-4 group ${r.hidden ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}`} />
                    ))}
                    <span className="ml-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">{r.rating}/5</span>
                  </div>
                  <button onClick={() => toggleHidden(r.id)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.hidden ? <><Eye className="w-3 h-3" /> Göster</> : <><EyeOff className="w-3 h-3" /> Gizle</>}
                  </button>
                </div>
                {r.comment && <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed mb-2">{r.comment}</p>}
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {TAG_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-zinc-400 font-semibold">{fDate(r.createdAt)} · Bilet: <code className="font-mono">{r.bookingId.slice(0, 8)}</code></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value, color, suffix = '' }: { icon: any; label: string; value: number; color: string; suffix?: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls[color]} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{value}{suffix}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      </div>
    </div>
  );
}
