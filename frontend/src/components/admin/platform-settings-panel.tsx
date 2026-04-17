"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, RotateCcw, Settings as SettingsIcon, Shield, DollarSign, Briefcase, Palette, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Setting {
  key: string;
  value: any;
  defaultValue: any;
  type: string;
  label: string;
  category: string;
  isCustomized: boolean;
}

const CATEGORY_META: Record<string, { label: string; icon: any; tone: string }> = {
  platform: { label: 'Platform', icon: SettingsIcon, tone: 'indigo' },
  financial: { label: 'Finans', icon: DollarSign, tone: 'emerald' },
  policy: { label: 'Politika', icon: Briefcase, tone: 'amber' },
  security: { label: 'Güvenlik', icon: Shield, tone: 'rose' },
  brand: { label: 'Marka', icon: Palette, tone: 'sky' },
};
const TONE: Record<string, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
  sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400',
};

export function PlatformSettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/settings');
      setSettings(res.data || []);
      setEdits({});
    } catch { toast.error('Yüklenemedi'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (key: string) => {
    setSaving(key);
    try {
      await api.patch(`/super-admin/settings/${key}`, { value: edits[key] });
      toast.success('Kaydedildi');
      setEdits((e) => { const n = { ...e }; delete n[key]; return n; });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setSaving(null);
    }
  };

  const reset = async (key: string) => {
    if (!confirm('Varsayılan değere dönülsün mü?')) return;
    try {
      await api.delete(`/super-admin/settings/${key}`);
      toast.success('Varsayılana dönüldü');
      load();
    } catch { toast.error('Sıfırlanamadı'); }
  };

  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, Setting[]>);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, items]) => {
        const meta = CATEGORY_META[cat] || { label: cat, icon: SettingsIcon, tone: 'slate' };
        const Icon = meta.icon;
        return (
          <motion.div key={cat} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONE[meta.tone]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{meta.label}</h3>
            </div>
            <div className="space-y-3">
              {items.map((s) => {
                const current = edits[s.key] !== undefined ? edits[s.key] : s.value;
                const changed = edits[s.key] !== undefined && edits[s.key] !== s.value;
                return (
                  <div key={s.key} className="flex items-center gap-4 flex-wrap py-2 border-b last:border-b-0 border-slate-100 dark:border-zinc-800/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{s.label}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{s.key}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.type === 'boolean' ? (
                        <button
                          onClick={() => setEdits((e) => ({ ...e, [s.key]: !current }))}
                          className={`w-12 h-6 rounded-full transition-colors relative ${current ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${current ? 'left-6' : 'left-0.5'}`} />
                        </button>
                      ) : s.type === 'number' ? (
                        <input
                          type="number"
                          value={current}
                          step={s.key.includes('RATE') || s.key.includes('COMMISSION') ? 0.01 : 1}
                          onChange={(e) => setEdits((ed) => ({ ...ed, [s.key]: Number(e.target.value) }))}
                          className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono font-bold text-right"
                        />
                      ) : (
                        <input
                          value={current}
                          onChange={(e) => setEdits((ed) => ({ ...ed, [s.key]: e.target.value }))}
                          className="w-64 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold"
                        />
                      )}
                      {changed && (
                        <button
                          onClick={() => save(s.key)}
                          disabled={saving === s.key}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
                        >
                          {saving === s.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Kaydet
                        </button>
                      )}
                      {s.isCustomized && !changed && (
                        <button onClick={() => reset(s.key)} title="Varsayılana dön" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
