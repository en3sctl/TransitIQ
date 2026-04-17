"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Flag, Key, Activity, Plus, Trash2, Save, RefreshCw, Copy, ShieldAlert, TrendingUp, Edit, Mail } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { alertDialog, confirmDialog, promptDialog } from "@/components/ui/dialogs";

// ─── Risk Report ───────────────────────────────────────────────────

export function PlatformRiskPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/risk-report');
      setItems(res.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const recompute = async () => {
    setRecomputing(true);
    try {
      const res = await api.post('/super-admin/risk-scores/recompute', {});
      toast.success(`${res.data.updated} firma skorlandı`);
      load();
    } catch { toast.error('Başarısız'); }
    finally { setRecomputing(false); }
  };

  const color = (s: number) => s >= 60 ? 'rose' : s >= 30 ? 'amber' : 'emerald';
  const TONE: Record<string, string> = {
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700',
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">Risk Skorları</h3>
          <p className="text-xs text-slate-500 font-medium">Yüksek skor = dolandırıcılık şüphesi. 60+ kritik, 30-60 takip et.</p>
        </div>
        <button onClick={recompute} disabled={recomputing} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50">
          {recomputing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Yeniden Hesapla
        </button>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
          {items.map((t) => {
            const c = color(t.riskScore);
            return (
              <div key={t.id} className="p-3 flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${TONE[c]}`}>
                  <div className="text-center">
                    <p className="text-xl font-black leading-none">{t.riskScore}</p>
                    <p className="text-[8px] font-bold opacity-70">RISK</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black">{t.publicName || t.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold flex-wrap">
                    <span>İptal oranı: %{t.indicators.cancelRate}</span>
                    <span>·</span>
                    <span>Başarısız iade: {t.indicators.failedRefunds}</span>
                    <span>·</span>
                    <span>Açık şikayet: {t.indicators.openComplaints}</span>
                    <span>·</span>
                    <span>{t.indicators.totalBookings30d} bilet/30g</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${TONE[c]}`}>
                  {t.riskScore >= 60 ? 'KRİTİK' : t.riskScore >= 30 ? 'TAKİP' : 'NORMAL'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Flags ─────────────────────────────────────────────────

export function PlatformFlagsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ key: '', name: '', description: '', audience: 'ALL', rolloutPct: 100 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/feature-flags');
      setItems(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (key: string, enabled: boolean) => {
    const flag = items.find((f) => f.key === key);
    if (!flag) return;
    try {
      await api.post(`/super-admin/feature-flags/${key}`, { ...flag, enabled });
      load();
    } catch { toast.error('Başarısız'); }
  };

  const create = async () => {
    if (!form.key || !form.name) { toast.error('Anahtar ve ad gerekli'); return; }
    try {
      await api.post(`/super-admin/feature-flags/${form.key}`, form);
      toast.success('Oluşturuldu');
      setCreating(false);
      setForm({ key: '', name: '', description: '', audience: 'ALL', rolloutPct: 100 });
      load();
    } catch { toast.error('Başarısız'); }
  };

  const remove = async (key: string) => {
    const ok = await confirmDialog({ title: 'Bayrak sil', message: `${key} bayrağı kalıcı olarak silinsin mi?`, variant: 'danger', confirmLabel: 'Sil' });
    if (!ok) return;
    try { await api.delete(`/super-admin/feature-flags/${key}`); load(); } catch { toast.error('Silinemedi'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">Özellik Bayrakları</h3>
          <p className="text-xs text-slate-500 font-medium">Deploy etmeden özellikleri aç/kapat, belirli firmalara rollout yap.</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> Yeni Flag
        </button>
      </div>

      {creating && (
        <div className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 space-y-2">
          <input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))} placeholder="NEW_SEAT_LAYOUT" className="w-full px-3 py-2 rounded-lg border text-sm font-mono" />
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ad" className="w-full px-3 py-2 rounded-lg border text-sm" />
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Açıklama" className="w-full px-3 py-2 rounded-lg border text-sm" />
          <div className="flex items-center gap-2">
            <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} className="px-3 py-2 rounded-lg border text-sm">
              <option value="ALL">Herkes</option>
              <option value="PERCENTAGE">Yüzde</option>
              <option value="TENANT_IDS">Belirli Firmalar</option>
            </select>
            {form.audience === 'PERCENTAGE' && (
              <input type="number" min={0} max={100} value={form.rolloutPct} onChange={(e) => setForm((f) => ({ ...f, rolloutPct: Number(e.target.value) }))} className="w-20 px-3 py-2 rounded-lg border text-sm" />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Oluştur</button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700">İptal</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((f) => (
          <div key={f.key} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <button onClick={() => toggle(f.key, !f.enabled)} className={`w-10 h-5 rounded-full relative ${f.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white ${f.enabled ? 'left-5' : 'left-0.5'}`} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold font-mono">{f.key}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {f.name} · {f.audience === 'ALL' ? 'Herkes' : f.audience === 'PERCENTAGE' ? `%${f.rolloutPct}` : `${f.tenantIds.length} firma`}
              </p>
            </div>
            <button onClick={() => remove(f.key)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-xs text-slate-400 font-bold py-10">Henüz bayrak yok</p>}
      </div>
    </div>
  );
}

// ─── Email Templates ───────────────────────────────────────────────

export function PlatformEmailTemplatesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/email-templates');
      setItems(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const seed = async () => {
    try {
      const res = await api.post('/super-admin/email-templates/seed', {});
      toast.success(`${res.data.created} şablon oluşturuldu`);
      load();
    } catch { toast.error('Başarısız'); }
  };

  const save = async () => {
    if (!selected) return;
    try {
      await api.post(`/super-admin/email-templates/${selected.key}`, selected);
      toast.success('Kaydedildi');
      load();
    } catch { toast.error('Kaydedilemedi'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">E-posta Şablonları</h3>
          <p className="text-xs text-slate-500 font-medium">Platform e-postalarının başlık ve içeriklerini özelleştir.</p>
        </div>
        {items.length === 0 && (
          <button onClick={seed} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Varsayılanlar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          {items.map((t) => (
            <button key={t.key} onClick={() => setSelected(t)} className={`w-full text-left p-3 rounded-xl border ${selected?.key === t.key ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}>
              <p className="text-sm font-bold">{t.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{t.key}</p>
            </button>
          ))}
        </div>
        <div className="md:col-span-2">
          {selected ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Konu</label>
                <input value={selected.subject} onChange={(e) => setSelected({ ...selected, subject: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">HTML İçerik</label>
                <textarea value={selected.bodyHtml} onChange={(e) => setSelected({ ...selected, bodyHtml: e.target.value })} rows={12} className="w-full px-3 py-2 rounded-lg border text-xs font-mono" />
              </div>
              {selected.variables && Array.isArray(selected.variables) && selected.variables.length > 0 && (
                <div className="text-[11px] text-slate-500 font-medium">
                  <strong>Değişkenler:</strong> {selected.variables.map((v: string) => `{{${v}}}`).join(', ')}
                </div>
              )}
              <button onClick={save} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                <Save className="w-3.5 h-3.5" /> Kaydet
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">Bir şablon seç</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── API Keys (company admin) ──────────────────────────────────────

export function TenantApiKeysPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/api-keys');
      setItems(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const name = await promptDialog({
      title: 'Yeni API Anahtarı',
      message: 'Bu anahtarı ne için kullanacaksın? Bir şey adlandır (ör: "Mobil App Production", "Dış Entegrasyon XYZ").',
      label: 'Anahtar Adı',
      placeholder: 'Mobil App Production',
      minLength: 3,
      maxLength: 80,
    });
    if (!name) return;
    try {
      const res = await api.post('/admin/api-keys', { name });
      setNewKey({ key: res.data.key, name: res.data.name });
      load();
    } catch { toast.error('Başarısız'); }
  };

  const revoke = async (id: string) => {
    const ok = await confirmDialog({
      title: 'API Anahtarını İptal Et',
      message: 'İptal edilen anahtarlar bir daha çalışmaz. Bu anahtarı kullanan uygulamalar kesintiye uğrar. Devam?',
      variant: 'danger',
      confirmLabel: 'İptal Et',
    });
    if (!ok) return;
    try { await api.delete(`/admin/api-keys/${id}`); load(); } catch { toast.error('Başarısız'); }
  };

  const copy = async (k: string) => {
    try { await navigator.clipboard.writeText(k); toast.success('Kopyalandı'); } catch { toast.info(k); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">API Anahtarları</h3>
          <p className="text-xs text-slate-500 font-medium">Dış uygulamanız için (mobil app, entegrasyonlar) API anahtarı oluşturun.</p>
        </div>
        <button onClick={create} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> Yeni Anahtar
        </button>
      </div>

      {newKey && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">"{newKey.name}" — Anahtarını şimdi kaydet</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 font-medium mb-2">
                Bu anahtar <strong>bir daha gösterilmeyecek</strong>. Güvenli bir yere kaydet.
              </p>
              <div className="flex gap-2 items-center bg-white dark:bg-zinc-900 rounded-lg p-2">
                <code className="flex-1 font-mono text-xs break-all">{newKey.key}</code>
                <button onClick={() => copy(newKey.key)} className="p-1.5 rounded hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={() => setNewKey(null)} className="text-xs font-bold px-2">Tamam</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      : items.length === 0 ? <div className="text-center py-10 text-xs text-slate-400 font-bold">Henüz anahtar yok</div>
      : (
        <div className="space-y-2">
          {items.map((k) => (
            <div key={k.id} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <Key className="w-5 h-5 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{k.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{k.keyPrefix}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Oluşturuldu: {new Date(k.createdAt).toLocaleDateString('tr-TR')}
                  {k.lastUsedAt && ` · Son kullanım: ${new Date(k.lastUsedAt).toLocaleDateString('tr-TR')}`}
                </p>
              </div>
              <button onClick={() => revoke(k.id)} className="p-2 rounded hover:bg-rose-50 text-rose-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Incidents ─────────────────────────────────────────────────────

export function PlatformIncidentsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'MAJOR', publicMessage: '' });

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/super-admin/incidents'); setItems(res.data || []); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.description) return;
    try {
      await api.post('/super-admin/incidents', form);
      toast.success('Incident açıldı');
      setCreating(false);
      setForm({ title: '', description: '', severity: 'MAJOR', publicMessage: '' });
      load();
    } catch { toast.error('Başarısız'); }
  };

  const addUpdate = async (incidentId: string) => {
    const status = await promptDialog({
      title: 'Vaka Durumu',
      message: 'Yeni durum: INVESTIGATING (araştırılıyor) · IDENTIFIED (tespit edildi) · MONITORING (izleniyor) · RESOLVED (çözüldü)',
      label: 'Durum',
      placeholder: 'INVESTIGATING',
      validate: (v) => ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'].includes(v.toUpperCase()) ? null : 'Geçersiz durum',
    });
    if (!status) return;
    const message = await promptDialog({
      title: 'Güncelleme Mesajı',
      message: 'Kullanıcılara gösterilecek açıklama (status sayfası).',
      label: 'Mesaj',
      type: 'textarea',
      minLength: 10,
    });
    if (!message) return;
    try {
      await api.post(`/super-admin/incidents/${incidentId}/updates`, { status: status.toUpperCase(), message });
      toast.success('Güncelleme eklendi');
      load();
    } catch { toast.error('Başarısız'); }
  };

  const SEVERITY_TONE: Record<string, string> = {
    MINOR: 'bg-sky-50 text-sky-700',
    MAJOR: 'bg-amber-50 text-amber-700',
    CRITICAL: 'bg-rose-50 text-rose-700',
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">Vaka Kayıtları</h3>
          <p className="text-xs text-slate-500 font-medium">Sistem kesintileri, Iyzico arızaları, veritabanı yavaşlıkları. Status sayfasında görünür.</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> Yeni Vaka
        </button>
      </div>

      {creating && (
        <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-500 rounded-2xl p-4 space-y-2">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Başlık" className="w-full px-3 py-2 rounded-lg border text-sm font-semibold" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Açıklama (dahili)" rows={2} className="w-full px-3 py-2 rounded-lg border text-sm" />
          <textarea value={form.publicMessage} onChange={(e) => setForm((f) => ({ ...f, publicMessage: e.target.value }))} placeholder="Kamuya açık mesaj (status sayfası)" rows={2} className="w-full px-3 py-2 rounded-lg border text-sm" />
          <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="px-3 py-2 rounded-lg border text-sm">
            <option value="MINOR">Minor</option>
            <option value="MAJOR">Major</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Oluştur</button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700">İptal</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((inc) => (
          <div key={inc.id} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black">{inc.title}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black ${SEVERITY_TONE[inc.severity]}`}>{inc.severity}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black ${inc.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{inc.status}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium mt-1">{inc.description}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Başlangıç: {new Date(inc.startedAt).toLocaleString('tr-TR')}
                  {inc.resolvedAt && ` · Çözüldü: ${new Date(inc.resolvedAt).toLocaleString('tr-TR')}`}
                </p>
              </div>
              {inc.status !== 'RESOLVED' && (
                <button onClick={() => addUpdate(inc.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold">
                  <Plus className="w-3 h-3" /> Güncelleme
                </button>
              )}
            </div>
            {inc.updates?.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-slate-200 dark:border-zinc-700 space-y-2">
                {inc.updates.map((u: any) => (
                  <div key={u.id} className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{u.status} · <span className="text-slate-400 font-medium">{new Date(u.createdAt).toLocaleString('tr-TR')}</span></p>
                    <p className="text-slate-600 dark:text-zinc-400 font-medium">{u.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-xs text-slate-400 font-bold py-10">Vaka yok — sistem sağlıklı</p>}
      </div>
    </div>
  );
}

// ─── Support Tickets ───────────────────────────────────────────────

export function PlatformTicketsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/super-admin/tickets'); setItems(res.data?.items || []); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openTicket = async (t: any) => {
    try {
      const res = await api.get(`/super-admin/tickets/${t.id}`);
      setSelected(res.data);
      setMessages(res.data.messages || []);
    } catch { toast.error('Yüklenemedi'); }
  };

  const sendReply = async (internal = false) => {
    if (!selected || !reply.trim()) return;
    try {
      await api.post(`/super-admin/tickets/${selected.id}/reply`, { body: reply, internal });
      setReply('');
      openTicket(selected);
      load();
    } catch { toast.error('Gönderilemedi'); }
  };

  const close = async (id: string) => {
    try { await api.patch(`/super-admin/tickets/${id}`, { status: 'RESOLVED' }); load(); setSelected(null); } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-280px)]">
      <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-3 border-b">
          <h3 className="text-sm font-black">Destek Talepleri · {items.length}</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {items.map((t) => (
            <button key={t.id} onClick={() => openTicket(t)} className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 ${selected?.id === t.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black ${
                  t.status === 'OPEN' ? 'bg-amber-50 text-amber-700' :
                  t.status === 'IN_PROGRESS' ? 'bg-sky-50 text-sky-700' :
                  t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>{t.status}</span>
                {t.priority === 'HIGH' || t.priority === 'URGENT' ? <span className="text-[9px] font-black text-rose-600">⚠</span> : null}
              </div>
              <p className="text-xs font-bold truncate">{t.subject}</p>
              <p className="text-[10px] text-slate-500 font-semibold truncate">{t.contactName} · {t.contactEmail}</p>
              <p className="text-[9px] text-slate-400 font-semibold">{new Date(t.createdAt).toLocaleDateString('tr-TR')} · {t._count?.messages || 0} mesaj</p>
            </button>
          ))}
          {items.length === 0 && <p className="text-center text-xs text-slate-400 font-bold py-6">Talep yok</p>}
        </div>
      </div>

      <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        {selected ? (
          <>
            <div className="p-3 border-b flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black">{selected.subject}</h3>
                <p className="text-[11px] text-slate-500 font-semibold">{selected.contactName} · {selected.contactEmail}</p>
              </div>
              <button onClick={() => close(selected.id)} className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Çözüldü</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`rounded-xl p-3 text-sm ${m.internal ? 'bg-amber-50 dark:bg-amber-500/5 border border-amber-200' : 'bg-slate-50 dark:bg-zinc-800/50'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {m.authorName} · {new Date(m.createdAt).toLocaleString('tr-TR')}
                    {m.internal && <span className="ml-2 text-amber-600">Dahili Not</span>}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>
            <div className="border-t p-3 space-y-2">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Cevap yaz..." className="w-full px-3 py-2 rounded-lg border text-sm" />
              <div className="flex gap-2">
                <button onClick={() => sendReply(false)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Cevapla</button>
                <button onClick={() => sendReply(true)} className="px-4 py-2 rounded-lg bg-slate-100 text-xs font-bold">Dahili Not</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">Talep seç</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
