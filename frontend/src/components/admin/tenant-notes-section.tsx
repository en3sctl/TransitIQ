"use client";

import { useEffect, useState } from "react";
import { Loader2, Pin, Trash2, Plus, Tag, X, Save, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog, promptDialog } from "@/components/ui/dialogs";

interface Props { tenantId: string; tenantName: string; }

export function TenantNotesSection({ tenantId, tenantName }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [n, t, tl] = await Promise.all([
        api.get(`/super-admin/tenants/${tenantId}/notes`),
        api.get(`/super-admin/tenants/${tenantId}/tags`),
        api.get(`/super-admin/tenants/${tenantId}/timeline`),
      ]);
      setNotes(n.data || []);
      setTags(t.data || []);
      setTimeline(tl.data || []);
    } catch { toast.error('Yüklenemedi'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tenantId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      await api.post(`/super-admin/tenants/${tenantId}/notes`, { body: newNote });
      setNewNote('');
      load();
    } catch { toast.error('Eklenemedi'); }
  };

  const togglePin = async (id: string, pinned: boolean) => {
    try { await api.patch(`/super-admin/notes/${id}`, { pinned: !pinned }); load(); } catch {}
  };

  const deleteNote = async (id: string) => {
    const ok = await confirmDialog({ title: 'Not sil', message: 'Bu not kalıcı olarak silinsin mi?', variant: 'danger', confirmLabel: 'Sil' });
    if (!ok) return;
    try { await api.delete(`/super-admin/notes/${id}`); load(); } catch { toast.error('Silinemedi'); }
  };

  const addTag = async () => {
    const label = await promptDialog({
      title: 'Yeni Etiket',
      message: `${tenantName} için etiket. Örn: VIP, yeni, riskli, hızlı-ödeyen`,
      label: 'Etiket',
      placeholder: 'VIP',
      maxLength: 30,
    });
    if (!label) return;
    try { await api.post(`/super-admin/tenants/${tenantId}/tags`, { label }); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Eklenemedi'); }
  };

  const removeTag = async (id: string) => {
    try { await api.delete(`/super-admin/tags/${id}`); load(); } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
      {/* Tags row */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-1.5"><Tag className="w-3 h-3" /> Etiketler</p>
          <button onClick={addTag} className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700"><Plus className="w-3 h-3" /> Ekle</button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.length === 0 && <p className="text-[11px] text-slate-400 font-medium">Etiket yok</p>}
          {tags.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold">
              {t.label}
              <button onClick={() => removeTag(t.id)} className="hover:text-rose-500"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" /> Dahili Notlar ({notes.length})
        </p>
        <div className="flex gap-2 mb-3">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Not ekle... (firma ile ilgili dahili yorum)"
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:border-indigo-500 outline-none"
          />
          <button onClick={addNote} disabled={!newNote.trim()} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50">
            <Save className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {notes.length === 0 && <p className="text-[11px] text-slate-400 font-medium text-center py-2">Not yok</p>}
          {notes.map((n) => (
            <div key={n.id} className={`p-2.5 rounded-lg border text-xs ${n.pinned ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-0.5">
                    {n.author?.name || 'Bilinmeyen'} · {new Date(n.createdAt).toLocaleString('tr-TR')}
                  </p>
                  <p className="text-xs text-slate-900 dark:text-white font-medium whitespace-pre-wrap">{n.body}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => togglePin(n.id, n.pinned)} className={`p-1 rounded ${n.pinned ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'}`} title="Sabitle">
                    <Pin className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteNote(n.id)} className="p-1 rounded text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Aktivite Zaman Çizelgesi
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {timeline.slice(0, 15).map((e: any) => (
              <div key={e.id} className="flex items-center gap-2 text-[11px] py-1">
                <span className="font-mono font-bold text-[9px] text-slate-400 shrink-0 w-24">{new Date(e.timestamp).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="inline-flex px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase shrink-0">{e.action}</span>
                <span className="text-slate-500 dark:text-zinc-400 font-medium truncate">{e.user?.name || 'Sistem'} · {e.entityType}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
