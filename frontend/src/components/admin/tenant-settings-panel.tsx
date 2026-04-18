"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Upload, Trash2, Save, BadgeCheck, Building2, CreditCard, KeyRound, AlertTriangle, ExternalLink, Palette, Phone, Mail, Globe, MapPin, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { confirmDialog } from "@/components/ui/dialogs";

interface TenantData {
  id: string;
  name: string;
  publicName: string | null;
  slug: string;
  domain: string | null;
  status: string;
  logoUrl: string | null;
  brandColor: string | null;
  aboutShort: string | null;
  aboutLong: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  website: string | null;
  address: string | null;
  taxId: string | null;
  mersisNo: string | null;
  uetdsLicense: string | null;
  verifiedAt: string | null;
  commissionRate: number;
  payment: { mode: 'PLATFORM' | 'OWN'; hasOwnCredentials: boolean };
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}
function toAbsolute(url: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : apiBase() + url;
}

interface PlanUsage {
  plan: { name: string; slug: string; monthlyFee: number; commissionRate: number; maxVehicles: number | null; maxRoutes: number | null; maxMonthlyBookings: number | null; } | null;
  usage: {
    vehicles: { current: number; limit: number | null };
    routes: { current: number; limit: number | null };
    monthlyBookings: { current: number; limit: number | null };
  };
}

export function TenantSettingsPanel() {
  const [data, setData] = useState<TenantData | null>(null);
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [form, setForm] = useState<Partial<TenantData>>({});
  const [payForm, setPayForm] = useState({ iyzicoMode: 'PLATFORM', iyzicoApiKey: '', iyzicoSecretKey: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [tenantRes, usageRes] = await Promise.all([
        api.get('/admin/tenant/me'),
        api.get('/admin/tenant/me/usage').catch(() => ({ data: null })),
      ]);
      const res = tenantRes;
      setUsage(usageRes.data);
      setData(res.data);
      setForm({
        publicName: res.data.publicName || '',
        brandColor: res.data.brandColor || '#4f46e5',
        aboutShort: res.data.aboutShort || '',
        aboutLong: res.data.aboutLong || '',
        supportEmail: res.data.supportEmail || '',
        supportPhone: res.data.supportPhone || '',
        website: res.data.website || '',
        address: res.data.address || '',
        taxId: res.data.taxId || '',
        mersisNo: res.data.mersisNo || '',
        uetdsLicense: res.data.uetdsLicense || '',
      });
      setPayForm({
        iyzicoMode: res.data.payment?.mode || 'PLATFORM',
        iyzicoApiKey: '',
        iyzicoSecretKey: '',
      });
    } catch {
      toast.error('Firma bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/admin/tenant/me', form);
      setData(res.data);
      toast.success('Firma bilgileri kaydedildi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async () => {
    setPaymentSaving(true);
    try {
      const body: any = { iyzicoMode: payForm.iyzicoMode };
      if (payForm.iyzicoApiKey) body.iyzicoApiKey = payForm.iyzicoApiKey;
      if (payForm.iyzicoSecretKey) body.iyzicoSecretKey = payForm.iyzicoSecretKey;
      const res = await api.patch('/admin/tenant/me/payment', body);
      setData(res.data);
      setPayForm({ ...payForm, iyzicoApiKey: '', iyzicoSecretKey: '' });
      toast.success('Ödeme ayarları kaydedildi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleLogoFile = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Logo en fazla 4 MB olabilir');
      return;
    }
    const fd = new FormData();
    fd.append('logo', file);
    setUploading(true);
    try {
      const res = await api.post('/admin/tenant/me/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setData((d) => d ? { ...d, logoUrl: res.data.logoUrl } : d);
      toast.success('Logo yüklendi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Logo yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    const ok = await confirmDialog({
      title: 'Logoyu kaldır',
      message: 'Firma logonuz silinecek. Yolcu/admin paneli yerine harf placeholder gösterilecek.',
      variant: 'warning',
      confirmLabel: 'Logoyu Sil',
    });
    if (!ok) return;
    try {
      await api.delete('/admin/tenant/me/logo');
      setData((d) => d ? { ...d, logoUrl: null } : d);
      toast.success('Logo silindi');
    } catch {
      toast.error('Silinemedi');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const logo = toAbsolute(data.logoUrl);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center"
      >
        <div className="flex items-center gap-4">
          {logo ? (
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={data.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black"
              style={{ backgroundColor: data.brandColor || '#4f46e5' }}
            >
              {(data.publicName || data.name)[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {data.publicName || data.name}
              </h3>
              {data.verifiedAt && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px] font-black">
                  <BadgeCheck className="w-3 h-3" /> Doğrulanmış
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              /firma/{data.slug} · Komisyon %{Math.round(data.commissionRate * 100 * 10) / 10}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              Durum: <span className={data.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}>{data.status}</span>
            </p>
          </div>
        </div>

        <div className="md:ml-auto flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs font-bold hover:bg-black disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {data.logoUrl ? 'Logo Değiştir' : 'Logo Yükle'}
          </button>
          {data.logoUrl && (
            <button
              onClick={removeLogo}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href={`/firma/${data.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Önizle
          </a>
        </div>
      </motion.div>

      {/* Plan kullanımı — plan atanmamışsa bile göster, aksiyon CTA'sı ile */}
      {usage && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Plan Kullanımı</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aktif plan</p>
              {usage.plan ? (
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {usage.plan.name} · %{(usage.plan.commissionRate * 100).toFixed(1)} komisyon
                  {usage.plan.monthlyFee > 0 ? ` + ₺${usage.plan.monthlyFee}/ay` : ''}
                </p>
              ) : (
                <p className="text-sm font-black text-amber-600 dark:text-amber-400">Plan atanmamış — sınırsız varsayılıyor</p>
              )}
            </div>
          </div>
          {!usage.plan && (
            <div className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-3 flex gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-300 font-medium leading-snug">
                Firmanıza aktif abonelik planı atanmamış. Super admin ile iletişime geçip Başlangıç / Profesyonel / Kurumsal planlarından birini seçin. Şimdilik limit uygulanmıyor.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <UsageBar label="Araç" current={usage.usage.vehicles.current} limit={usage.usage.vehicles.limit} />
            <UsageBar label="Rota" current={usage.usage.routes.current} limit={usage.usage.routes.limit} />
            <UsageBar label="Bu ay bilet" current={usage.usage.monthlyBookings.current} limit={usage.usage.monthlyBookings.limit} />
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Marka & Tanıtım</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Yolculara Gösterilecek İsim</label>
            <input
              value={form.publicName || ''}
              onChange={(e) => setForm({ ...form, publicName: e.target.value })}
              placeholder={data.name}
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3 h-3" /> Marka Rengi
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brandColor || '#4f46e5'}
                onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                className="w-12 h-10 rounded-lg border border-slate-200 dark:border-zinc-800 cursor-pointer"
              />
              <input
                value={form.brandColor || ''}
                onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                placeholder="#4f46e5"
                maxLength={7}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Kısa Tanıtım (240 karakter)</label>
            <input
              value={form.aboutShort || ''}
              onChange={(e) => setForm({ ...form, aboutShort: e.target.value })}
              placeholder="Örn: 25 yıllık tecrübemizle İç Anadolu'nun en güvenilir şehirlerarası ulaşım firması"
              maxLength={240}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Detaylı Tanıtım</label>
            <textarea
              value={form.aboutLong || ''}
              onChange={(e) => setForm({ ...form, aboutLong: e.target.value })}
              rows={4}
              placeholder="Firmanız hakkında detaylı bilgi, filo kompozisyonu, hizmet standartları..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Phone className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">İletişim</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'supportEmail', label: 'Destek E-postası', icon: Mail, type: 'email', placeholder: 'destek@firma.com' },
            { key: 'supportPhone', label: 'Destek Telefonu', icon: Phone, type: 'tel', placeholder: '0850 xxx xx xx' },
            { key: 'website', label: 'Web Sitesi', icon: Globe, type: 'url', placeholder: 'https://firma.com' },
            { key: 'address', label: 'Adres', icon: MapPin, type: 'text', placeholder: 'Ofis adresi' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.key}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Icon className="w-3 h-3" /> {f.label}
                </label>
                <input
                  type={f.type}
                  value={(form as any)[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value } as any)}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legal */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Yasal Bilgiler</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'taxId', label: 'Vergi No' },
            { key: 'mersisNo', label: 'MERSİS No' },
            { key: 'uetdsLicense', label: 'D1/D2/D4 Belge No' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">{f.label}</label>
              <input
                value={(form as any)[f.key] || ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value } as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
              />
            </div>
          ))}
        </div>
        {!data.verifiedAt && (
          <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/80 dark:border-amber-500/20 p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              Belgeleri doldurup kaydettikten sonra platform ekibi firmanı doğrular ve "Doğrulanmış" rozeti alırsın.
            </p>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Değişiklikleri Kaydet
        </button>
      </div>

      {/* Payment */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Ödeme Yönlendirme</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setPayForm({ ...payForm, iyzicoMode: 'PLATFORM' })}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              payForm.iyzicoMode === 'PLATFORM'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Platform Hesabı</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
              Ödemeler TransitIQ hesabına gelir, komisyonumuz kesilip kalanı size EFT yapılır. Hızlı başlangıç için önerilir.
            </p>
          </button>
          <button
            onClick={() => setPayForm({ ...payForm, iyzicoMode: 'OWN' })}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              payForm.iyzicoMode === 'OWN'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Kendi Iyzico Hesabım</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
              Ödemeler direkt sizin Iyzico hesabınıza düşer; komisyon TransitIQ tarafından faturayla tahsil edilir.
            </p>
          </button>
        </div>

        {payForm.iyzicoMode === 'OWN' && (
          <div className="space-y-3 border-t border-slate-100 dark:border-zinc-800 pt-4">
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 flex gap-2.5">
              <KeyRound className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                Iyzico panelinden <strong>API anahtarını ve gizli anahtarını</strong> alıp buraya gir.
                {data.payment?.hasOwnCredentials && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">✓ Kayıtlı</span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Iyzico API Key</label>
                <input
                  type="password"
                  value={payForm.iyzicoApiKey}
                  onChange={(e) => setPayForm({ ...payForm, iyzicoApiKey: e.target.value })}
                  placeholder={data.payment?.hasOwnCredentials ? '••••••••••••' : 'sandbox-...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Iyzico Secret Key</label>
                <input
                  type="password"
                  value={payForm.iyzicoSecretKey}
                  onChange={(e) => setPayForm({ ...payForm, iyzicoSecretKey: e.target.value })}
                  placeholder={data.payment?.hasOwnCredentials ? '••••••••••••' : 'sandbox-...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={savePayment}
            disabled={paymentSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold text-sm hover:bg-black dark:hover:bg-white disabled:opacity-50"
          >
            {paymentSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Ödeme Ayarlarını Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((current / Math.max(1, limit!)) * 100));
  const tone = unlimited
    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
    : pct >= 100 ? 'bg-rose-500'
    : pct >= 80 ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
        {!unlimited && pct >= 80 && (
          <span className={`text-[9px] font-black uppercase tracking-widest ${pct >= 100 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {pct >= 100 ? 'Limit doldu' : 'Dolmak üzere'}
          </span>
        )}
      </div>
      <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
        {current.toLocaleString('tr-TR')}
        <span className="text-sm text-slate-400 font-bold ml-1">/ {unlimited ? '∞' : limit!.toLocaleString('tr-TR')}</span>
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full transition-all ${unlimited ? 'bg-indigo-500' : tone}`}
          style={{ width: unlimited ? '100%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}
