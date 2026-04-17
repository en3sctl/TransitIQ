"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Package, Check, Save, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyFee: number;
  commissionRate: number;
  maxVehicles: number | null;
  maxRoutes: number | null;
  maxMonthlyBookings: number | null;
  features: string[];
  active: boolean;
  sortOrder: number;
}

export function PlatformPlansPanel() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, Partial<Plan>>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/plans');
      setItems(res.data || []);
      setEdits({});
    } catch { setItems([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const seed = async () => {
    try {
      const res = await api.post('/super-admin/plans/seed', {});
      toast.success(`${res.data.created} plan oluşturuldu`);
      load();
    } catch { toast.error('Seed başarısız'); }
  };

  const save = async (id: string) => {
    try {
      await api.patch(`/super-admin/plans/${id}`, edits[id]);
      toast.success('Kaydedildi');
      load();
    } catch { toast.error('Kaydedilemedi'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Abonelik Planları</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Firmalara sunduğun tier'lar — onboarding'de seçilir.</p>
        </div>
        {items.length === 0 && (
          <button onClick={seed} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Varsayılan planları oluştur
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Henüz plan yok</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((p) => {
            const ed = edits[p.id] || {};
            const val = (k: keyof Plan) => ed[k] !== undefined ? (ed[k] as any) : p[k];
            const hasChange = Object.keys(ed).length > 0;
            return (
              <div key={p.id} className={`bg-white dark:bg-zinc-900 border-2 rounded-2xl p-5 ${p.active ? 'border-indigo-200 dark:border-indigo-500/30' : 'border-slate-200 dark:border-zinc-800 opacity-60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <input
                    value={val('name') as string}
                    onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], name: e.target.value } }))}
                    className="text-lg font-black bg-transparent outline-none flex-1"
                  />
                  <button
                    onClick={() => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], active: !val('active') } }))}
                    className={`w-10 h-5 rounded-full relative transition-colors ${val('active') ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${val('active') ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mb-3">/{p.slug}</p>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aylık Ücret (TL)</label>
                    <input
                      type="number"
                      value={val('monthlyFee') as number}
                      onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], monthlyFee: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Komisyon (0-0.5)</label>
                    <input
                      type="number"
                      step={0.01}
                      value={val('commissionRate') as number}
                      onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], commissionRate: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">= %{((val('commissionRate') as number) * 100).toFixed(1)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Araç</label>
                      <input type="number" value={(val('maxVehicles') as number) || ''} placeholder="∞" onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], maxVehicles: e.target.value ? Number(e.target.value) : null } }))} className="w-full px-2 py-1 rounded border border-slate-200 text-xs" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rota</label>
                      <input type="number" value={(val('maxRoutes') as number) || ''} placeholder="∞" onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], maxRoutes: e.target.value ? Number(e.target.value) : null } }))} className="w-full px-2 py-1 rounded border border-slate-200 text-xs" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bilet/Ay</label>
                      <input type="number" value={(val('maxMonthlyBookings') as number) || ''} placeholder="∞" onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], maxMonthlyBookings: e.target.value ? Number(e.target.value) : null } }))} className="w-full px-2 py-1 rounded border border-slate-200 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Özellikler (satır başı)</label>
                    <textarea
                      value={(val('features') as string[]).join('\n')}
                      onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], features: e.target.value.split('\n').filter(Boolean) } }))}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                    />
                  </div>
                </div>
                {hasChange && (
                  <button onClick={() => save(p.id)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                    <Save className="w-3 h-3" /> Kaydet
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
