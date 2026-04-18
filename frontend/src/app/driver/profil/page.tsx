"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Phone, Mail, MapPin, Calendar, Droplet, Shirt, HeartPulse,
  FileText, Loader2, Save, ArrowLeft, Star, Trophy, Bus,
  Plus, AlertTriangle, Check, Bell, Globe, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/protected-route";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { formatPhoneTR } from "@/lib/formatters";
import { confirmDialog } from "@/components/ui/dialogs";

interface DriverDocument {
  id: string;
  type: string;
  documentNumber: string | null;
  licenseClass: string | null;
  issuedAt: string | null;
  validUntil: string | null;
  note: string | null;
}

const DOC_META: Record<string, { label: string; hint: string }> = {
  LICENSE: { label: 'Ehliyet', hint: 'Sürücü belgesi (sınıf + geçerlilik)' },
  SRC1: { label: 'SRC1', hint: 'Tehlikeli madde taşımacılığı' },
  SRC2: { label: 'SRC2', hint: 'Yurtiçi yük taşımacılığı' },
  SRC3: { label: 'SRC3', hint: 'Yurtiçi yolcu taşımacılığı (ŞART)' },
  SRC4: { label: 'SRC4', hint: 'Yurtdışı yolcu taşımacılığı' },
  PSYCHOTECH: { label: 'Psikoteknik', hint: '5 yılda bir yenilenir' },
  HEALTH_REPORT: { label: 'Sağlık Raporu', hint: 'Profesyonel şoförler için zorunlu' },
  CRIMINAL_RECORD: { label: 'Adli Sicil', hint: 'Bazı firmalar için gerekli' },
};

function DriverProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    dateOfBirth: '', bloodType: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    address: '', city: '', shirtSize: '',
    language: 'tr',
    notifyEmail: true, notifySms: false, notifyPush: true,
  });
  const [docDraft, setDocDraft] = useState<{ type: string; documentNumber?: string; licenseClass?: string; issuedAt?: string; validUntil?: string; note?: string }>({ type: 'LICENSE' });
  const [showDocForm, setShowDocForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driver-ops/me/profile');
      setData(res.data);
      const p = res.data.profile || {};
      setForm({
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
        bloodType: p.bloodType || '',
        emergencyContactName: p.emergencyContactName || '',
        emergencyContactPhone: p.emergencyContactPhone || '',
        emergencyContactRelation: p.emergencyContactRelation || '',
        address: p.address || '',
        city: p.city || '',
        shirtSize: p.shirtSize || '',
        language: p.language || 'tr',
        notifyEmail: p.notifyEmail !== false,
        notifySms: !!p.notifySms,
        notifyPush: p.notifyPush !== false,
      });
    } catch { toast.error('Profil yüklenemedi'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/driver-ops/me/profile', {
        ...form,
        dateOfBirth: form.dateOfBirth || null,
      });
      toast.success('Kaydedildi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi');
    } finally { setSaving(false); }
  };

  const saveDoc = async () => {
    if (!docDraft.type) { toast.error('Belge türü seç'); return; }
    try {
      await api.post('/driver-ops/me/documents', docDraft);
      toast.success('Belge kaydedildi');
      setShowDocForm(false);
      setDocDraft({ type: 'LICENSE' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi');
    }
  };

  const removeDoc = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Belgeyi sil',
      message: 'Bu belge kaydı silinecek. Emin misin?',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/driver-ops/me/documents/${id}`);
      toast.success('Silindi');
      load();
    } catch { toast.error('Silinemedi'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const u = data?.user || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/driver')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Profilim</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{u.name} · {user?.role === 'DRIVER' ? 'Şoför' : u.role}</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Kaydet
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero / Stats */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 text-white rounded-3xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center text-3xl font-black border border-white/20">
              {u.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="text-xl font-black tracking-tight">{u.name}</p>
              <p className="text-sm opacity-80 font-medium">{u.email}</p>
              {u.phoneNumber && <p className="text-xs opacity-70 font-mono mt-0.5">{u.phoneNumber}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <StatCard icon={Bus} label="Tamamlanan sefer" value={stats.completedTrips || 0} />
            <StatCard icon={Star} label="Ortalama puan" value={stats.averageRating != null ? stats.averageRating.toFixed(1) : '—'} />
            <StatCard icon={Trophy} label="Yorum sayısı" value={stats.reviewCount || 0} />
          </div>
        </motion.div>

        {/* Kişisel Bilgiler */}
        <Section title="Kişisel Bilgiler" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Doğum Tarihi" icon={Calendar}>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Kan Grubu" icon={Droplet}>
              <select
                value={form.bloodType}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                className={inputCls}
              >
                <option value="">Seç...</option>
                {['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Şehir" icon={MapPin}>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
                placeholder="İstanbul"
              />
            </Field>
            <Field label="Üniforma Bedeni" icon={Shirt}>
              <select
                value={form.shirtSize}
                onChange={(e) => setForm({ ...form, shirtSize: e.target.value })}
                className={inputCls}
              >
                <option value="">Seç...</option>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Adres" icon={MapPin}>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputCls}
                  placeholder="Mahalle, sokak, ilçe"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Acil Kontak */}
        <Section title="Acil Durum Kontağı" icon={HeartPulse}>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-3">
            Bir kaza/sağlık sorunu durumunda ulaşılacak yakın kişi — SOS olayında otomatik bilgilendirilebilir.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Ad Soyad">
              <input
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                className={inputCls}
                placeholder="Eşi, kardeşi, vb."
              />
            </Field>
            <Field label="Telefon">
              <input
                type="tel"
                inputMode="tel"
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: formatPhoneTR(e.target.value) })}
                className={inputCls}
                placeholder="0532 123 45 67"
              />
            </Field>
            <Field label="Yakınlık">
              <select
                value={form.emergencyContactRelation}
                onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}
                className={inputCls}
              >
                <option value="">Seç...</option>
                {['Eş', 'Anne', 'Baba', 'Kardeş', 'Çocuk', 'Arkadaş', 'Diğer'].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* Belgeler */}
        <Section title="Belgeler" icon={FileText}>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-3">
            Ehliyet, SRC, psikoteknik, sağlık raporu. Süreler yaklaşınca otomatik hatırlatılır.
          </p>
          <div className="space-y-2">
            {data?.documents?.length > 0 ? (
              data.documents.map((d: DriverDocument) => {
                const meta = DOC_META[d.type] || { label: d.type, hint: '' };
                const validUntil = d.validUntil ? new Date(d.validUntil) : null;
                const daysLeft = validUntil ? Math.ceil((validUntil.getTime() - Date.now()) / 86400000) : null;
                const expired = daysLeft != null && daysLeft < 0;
                const soon = daysLeft != null && daysLeft >= 0 && daysLeft <= 30;
                return (
                  <div
                    key={d.id}
                    className={`bg-white dark:bg-zinc-900 border rounded-xl p-3 flex items-center gap-3 ${
                      expired ? 'border-rose-300 dark:border-rose-500/40' : soon ? 'border-amber-300 dark:border-amber-500/40' : 'border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{meta.label}</p>
                        {d.licenseClass && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600">Sınıf {d.licenseClass}</span>}
                        {expired ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">Süresi geçti</span>
                        ) : soon ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">{daysLeft} gün kaldı</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                        {d.documentNumber && <span>No: {d.documentNumber}</span>}
                        {validUntil && <span>Bitiş: {validUntil.toLocaleDateString('tr-TR')}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeDoc(d.id)} className="text-rose-500 hover:text-rose-600 text-xs font-bold px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10">
                      Sil
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 font-medium py-4 text-center">Henüz belge eklenmemiş.</p>
            )}

            {showDocForm ? (
              <div className="bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Belge Türü">
                    <select
                      value={docDraft.type}
                      onChange={(e) => setDocDraft({ ...docDraft, type: e.target.value })}
                      className={inputCls}
                    >
                      {Object.entries(DOC_META).map(([k, m]) => (
                        <option key={k} value={k}>{m.label}</option>
                      ))}
                    </select>
                  </Field>
                  {docDraft.type === 'LICENSE' && (
                    <Field label="Sınıf">
                      <select
                        value={docDraft.licenseClass || ''}
                        onChange={(e) => setDocDraft({ ...docDraft, licenseClass: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">Seç</option>
                        {['B', 'C', 'C1', 'D', 'D1', 'E'].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label="Belge No">
                    <input
                      value={docDraft.documentNumber || ''}
                      onChange={(e) => setDocDraft({ ...docDraft, documentNumber: e.target.value })}
                      className={inputCls}
                      placeholder="Opsiyonel"
                    />
                  </Field>
                  <Field label="Veriliş">
                    <input
                      type="date"
                      value={docDraft.issuedAt || ''}
                      onChange={(e) => setDocDraft({ ...docDraft, issuedAt: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Bitiş">
                    <input
                      type="date"
                      value={docDraft.validUntil || ''}
                      onChange={(e) => setDocDraft({ ...docDraft, validUntil: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">{DOC_META[docDraft.type]?.hint}</p>
                <div className="flex items-center gap-2">
                  <button onClick={saveDoc} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">Kaydet</button>
                  <button onClick={() => { setShowDocForm(false); setDocDraft({ type: 'LICENSE' }); }} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">Vazgeç</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDocForm(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 text-sm font-bold hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Yeni belge ekle
              </button>
            )}
          </div>
        </Section>

        {/* Bildirim Tercihleri */}
        <Section title="Bildirim Tercihleri" icon={Bell}>
          <div className="space-y-2">
            <Toggle
              label="E-posta bildirimi"
              description="Sefer atama, duyuru, ödeme"
              value={form.notifyEmail}
              onChange={(v) => setForm({ ...form, notifyEmail: v })}
            />
            <Toggle
              label="SMS bildirimi"
              description="Acil haberler, sefer değişikliği"
              value={form.notifySms}
              onChange={(v) => setForm({ ...form, notifySms: v })}
            />
            <Toggle
              label="Push bildirimi"
              description="Mobil uygulama (gelecek)"
              value={form.notifyPush}
              onChange={(v) => setForm({ ...form, notifyPush: v })}
            />
          </div>
        </Section>

        {/* Dil */}
        <Section title="Uygulama Dili" icon={Globe}>
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className={inputCls}
          >
            <option value="tr">Türkçe</option>
            <option value="en">English (yakında)</option>
          </select>
        </Section>

        {/* Sabit alt kaydet */}
        <div className="md:hidden sticky bottom-4 px-4">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-2xl shadow-indigo-500/30 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Küçük yardımcı bileşenler ───

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none";

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-3">
      <Icon className="w-4 h-4 opacity-80 mb-1" />
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
      <p className="text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-left"
    >
      <div className="flex-1">
        <p className="text-sm font-black text-slate-900 dark:text-white">{label}</p>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">{description}</p>
      </div>
      <div className={`w-11 h-6 rounded-full relative transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['DRIVER', 'COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <DriverProfilePage />
    </ProtectedRoute>
  );
}
