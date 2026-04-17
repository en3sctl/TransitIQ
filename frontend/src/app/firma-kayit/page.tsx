"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, FileText, Phone, UserCircle, CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, ArrowRight, Loader2, Check, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
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
  sortOrder: number;
}

const STEPS = [
  { id: 1, label: 'Firma', icon: Building2 },
  { id: 2, label: 'Yasal', icon: FileText },
  { id: 3, label: 'İletişim', icon: Phone },
  { id: 4, label: 'Admin', icon: UserCircle },
  { id: 5, label: 'Plan', icon: CreditCard },
  { id: 6, label: 'Onay', icon: ShieldCheck },
];

function slugify(text: string): string {
  const tr: Record<string, string> = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };
  return text
    .split('').map((c) => tr[c] ?? c).join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// VergiNo: 10 hane (sadece rakam)
function formatTaxId(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

// MERSİS: 16 hane → "XXXX-XXXX-XXXX-XXXX" (kullanıcı yazarken tireler kendiliğinden gelir)
function formatMersis(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  const parts = [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12), digits.slice(12, 16)].filter(Boolean);
  return parts.join('-');
}

// D Belgesi: TR formatı "[Harf][Rakam]-[Rakamlar]" (örn: D1-12345, K2-987)
// Kullanıcı "D112345" yazsa bile otomatik "D1-12345" yapılır.
function formatLicense(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 0) return '';
  // İlk karakter harf, ikinci karakter rakam, sonrasında tire ile rakamlar
  const letter = cleaned.slice(0, 1).replace(/[^A-Z]/g, '');
  if (!letter) return '';
  const rest = cleaned.slice(1);
  if (rest.length === 0) return letter;
  const digit = rest.slice(0, 1).replace(/\D/g, '');
  if (!digit) return letter;
  const tail = rest.slice(1).replace(/\D/g, '').slice(0, 15);
  return tail ? `${letter}${digit}-${tail}` : `${letter}${digit}`;
}

// Telefon: 0XXX XXX XX XX (11 hane, otomatik gruplama)
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length <= 9) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
}

export default function FirmaRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // 1
    companyName: '', publicName: '', slug: '', domain: '', aboutShort: '',
    // 2
    taxId: '', mersisNo: '', uetdsLicense: '',
    // 3
    supportEmail: '', supportPhone: '', website: '', address: '',
    // 4
    adminName: '', adminEmail: '', adminPhone: '', adminPassword: '', adminPasswordConfirm: '',
    // 5
    planSlug: '', iyzicoMode: 'PLATFORM' as 'PLATFORM' | 'OWN',
    // 6
    acceptsTerms: false, acceptsKvkk: false,
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [slugCheck, setSlugCheck] = useState<{ available: boolean | null; reason: string | null }>({ available: null, reason: null });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    api.get('/onboarding/plans').then((res) => setPlans(res.data || [])).catch(() => setPlans([]));
  }, []);

  // Auto-generate slug from company name if user hasn't typed one
  useEffect(() => {
    if (form.companyName && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(form.companyName) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.companyName]);

  // Debounced slug check
  useEffect(() => {
    if (!form.slug || form.slug.length < 2) { setSlugCheck({ available: null, reason: null }); return; }
    let aborted = false;
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/onboarding/check-slug', { params: { slug: form.slug } });
        if (!aborted) setSlugCheck(res.data);
      } catch { if (!aborted) setSlugCheck({ available: null, reason: null }); }
    }, 400);
    return () => { aborted = true; clearTimeout(t); };
  }, [form.slug]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const canAdvance = () => {
    switch (step) {
      case 1:
        return form.companyName.length >= 2 && form.slug.length >= 2 && slugCheck.available === true;
      case 2:
        return true; // belgeler opsiyonel, uyarı vereceğiz
      case 3:
        return true;
      case 4:
        return form.adminName.length >= 2
          && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.adminEmail)
          && form.adminPassword.length >= 8
          && form.adminPassword === form.adminPasswordConfirm;
      case 5:
        return true;
      case 6:
        return form.acceptsTerms && form.acceptsKvkk;
      default:
        return true;
    }
  };

  const next = () => {
    if (!canAdvance()) {
      toast.error('Lütfen tüm zorunlu alanları doldur');
      return;
    }
    setStep((s) => Math.min(s + 1, 6));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    if (!canAdvance()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/onboarding/tenant', {
        companyName: form.companyName,
        publicName: form.publicName || undefined,
        slug: form.slug,
        domain: form.domain || undefined,
        aboutShort: form.aboutShort || undefined,
        taxId: form.taxId || undefined,
        mersisNo: form.mersisNo || undefined,
        uetdsLicense: form.uetdsLicense || undefined,
        supportEmail: form.supportEmail || undefined,
        supportPhone: form.supportPhone || undefined,
        website: form.website || undefined,
        address: form.address || undefined,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone || undefined,
        adminPassword: form.adminPassword,
        planSlug: form.planSlug || undefined,
        iyzicoMode: form.iyzicoMode,
        acceptsTerms: form.acceptsTerms,
        acceptsKvkk: form.acceptsKvkk,
      });
      setDone(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Kayıt başarısız';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        <LandingNav />
        <div className="max-w-2xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">
              {done.status === 'ACTIVE' ? 'Hoş geldin!' : 'Başvurun alındı!'}
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed mb-6 max-w-md mx-auto">
              {done.message}
            </p>
            {done.status === 'ACTIVE' ? (
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Admin Paneline Git <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold"
              >
                Ana Sayfaya Dön
              </Link>
            )}
          </motion.div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <LandingNav />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Firma Kaydı
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3 leading-[1.05]">
            Firmanızı <span className="text-indigo-600 dark:text-indigo-400">TransitIQ'ya</span> getirin
          </h1>
          <p className="text-base text-slate-500 dark:text-zinc-400 font-medium max-w-xl mx-auto">
            Türkiye'nin modern otobüs ticarethanesine katılın. Kayıt ücretsiz, sadece sattığınız biletten komisyon.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-10 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex flex-col items-center gap-1 ${i > 0 ? '' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                  }`}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    active ? 'text-indigo-600 dark:text-indigo-400' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 min-w-[20px] h-0.5 mx-2 ${done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-zinc-800'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <Step1 form={form} update={update} slugCheck={slugCheck} />}
              {step === 2 && <Step2 form={form} update={update} />}
              {step === 3 && <Step3 form={form} update={update} />}
              {step === 4 && <Step4 form={form} update={update} />}
              {step === 5 && <Step5 form={form} update={update} plans={plans} />}
              {step === 6 && <Step6 form={form} update={update} plans={plans} />}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={back}
              disabled={step === 1}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-zinc-700"
            >
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            {step < 6 ? (
              <button
                onClick={next}
                disabled={!canAdvance()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50"
              >
                Devam <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting || !canAdvance()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Kaydı Tamamla
              </button>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

// ─── Individual steps ────────────────────────────────────────────

function Field({ label, required, hint, children }: any) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 font-medium mt-1.5">{hint}</p>}
    </div>
  );
}
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none";

function Step1({ form, update, slugCheck }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Firma Bilgileri</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">İşletme ticari ünvanı ve platformda görüneceği bilgiler.</p>
      </div>
      <Field label="Ticari Ünvan" required>
        <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} className={inputCls} placeholder="Örn: Tosya Seyahat Turizm Tic. Ltd. Şti." />
      </Field>
      <Field label="Yolculara Gösterilecek İsim" hint="Boş bırakılırsa ticari ünvan gösterilir">
        <input value={form.publicName} onChange={(e) => update('publicName', e.target.value)} className={inputCls} placeholder="Örn: Tosya Seyahat" />
      </Field>
      <Field label="Slug (URL)" required hint="Firma profil sayfanızın URL'si: /firma/[slug]. Sadece küçük harf, sayı, tire.">
        <div className="relative">
          <input
            value={form.slug}
            onChange={(e) => update('slug', e.target.value.toLowerCase())}
            className={inputCls}
            placeholder="tosyaseyahat"
            maxLength={50}
          />
          {form.slug.length >= 2 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {slugCheck.available === true ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                : slugCheck.available === false ? <AlertCircle className="w-4 h-4 text-rose-500" />
                : <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
          )}
        </div>
        {form.slug && slugCheck.reason && (
          <p className={`text-[11px] font-semibold mt-1 ${slugCheck.available ? 'text-emerald-600' : 'text-rose-600'}`}>
            {slugCheck.reason || 'Kullanılabilir'}
          </p>
        )}
      </Field>
      <Field label="Özel Domain" hint="Opsiyonel — kendi domaininizden de erişilebilir (ileride)">
        <input value={form.domain} onChange={(e) => update('domain', e.target.value)} className={inputCls} placeholder="tosya-seyahat.com" />
      </Field>
      <Field label="Kısa Tanıtım (240 karakter)" hint="Firma profil sayfanızın üstünde görünür">
        <textarea value={form.aboutShort} onChange={(e) => update('aboutShort', e.target.value)} rows={3} maxLength={240} className={inputCls + ' resize-none'} placeholder="25 yıllık tecrübemizle İç Anadolu'nun en güvenilir şehirlerarası ulaşım firması." />
      </Field>
    </div>
  );
}

function Step2({ form, update }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Yasal Bilgiler</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Türkiye'de otobüs işletmek için gerekli belge numaraları.</p>
      </div>
      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/80 dark:border-amber-500/20 p-3 flex gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
          Belgeler şu an opsiyonel ama <strong>onay için şart</strong>. Platform ekibi bu bilgileri kontrol edip firmayı doğrular.
          Eksik bırakırsanız doğrulanmış rozeti almazsınız.
        </p>
      </div>
      <Field label="Vergi Numarası" hint="10 haneli, sadece rakam">
        <input
          inputMode="numeric"
          value={form.taxId}
          onChange={(e) => update('taxId', formatTaxId(e.target.value))}
          className={inputCls}
          placeholder="1234567890"
        />
      </Field>
      <Field label="MERSİS Numarası" hint="16 haneli, tireler otomatik eklenir">
        <input
          inputMode="numeric"
          value={form.mersisNo}
          onChange={(e) => update('mersisNo', formatMersis(e.target.value))}
          className={inputCls}
          placeholder="0123-4567-8901-2345"
        />
      </Field>
      <Field label="D1/D2/D4 Yetki Belgesi No" hint="UAB tarafından verilen belge numarası — otomatik büyük harf">
        <input
          value={form.uetdsLicense}
          onChange={(e) => update('uetdsLicense', formatLicense(e.target.value))}
          className={inputCls}
          placeholder="D1-12345"
        />
      </Field>
    </div>
  );
}

function Step3({ form, update }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1">İletişim</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Yolcuların size ulaşabileceği kanallar.</p>
      </div>
      <Field label="Destek E-postası">
        <input type="email" value={form.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} className={inputCls} placeholder="destek@firma.com" />
      </Field>
      <Field label="Destek Telefonu" hint="Otomatik gruplanır">
        <input type="tel" inputMode="tel" value={form.supportPhone} onChange={(e) => update('supportPhone', formatPhone(e.target.value))} className={inputCls} placeholder="0850 123 45 67" />
      </Field>
      <Field label="Website">
        <input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} className={inputCls} placeholder="https://firma.com" />
      </Field>
      <Field label="Merkez Ofis Adresi">
        <textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
      </Field>
    </div>
  );
}

function Step4({ form, update }: any) {
  const pwdOk = form.adminPassword.length >= 8;
  const pwdMatch = form.adminPassword === form.adminPasswordConfirm;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Admin Kullanıcı</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Firma panelinin ilk admin'i (daha sonra ek kullanıcı ekleyebilirsiniz).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Ad Soyad" required>
          <input value={form.adminName} onChange={(e) => update('adminName', e.target.value)} className={inputCls} />
        </Field>
        <Field label="E-posta (giriş için)" required>
          <input type="email" value={form.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Cep Telefonu" hint="Otomatik gruplanır">
          <input type="tel" inputMode="tel" value={form.adminPhone} onChange={(e) => update('adminPhone', formatPhone(e.target.value))} className={inputCls} placeholder="0532 123 45 67" />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Parola" required hint="En az 8 karakter">
          <input type="password" value={form.adminPassword} onChange={(e) => update('adminPassword', e.target.value)} className={inputCls} />
          {form.adminPassword && !pwdOk && <p className="text-[11px] text-rose-600 font-semibold mt-1">Parola çok kısa</p>}
        </Field>
        <Field label="Parola Tekrar" required>
          <input type="password" value={form.adminPasswordConfirm} onChange={(e) => update('adminPasswordConfirm', e.target.value)} className={inputCls} />
          {form.adminPasswordConfirm && !pwdMatch && <p className="text-[11px] text-rose-600 font-semibold mt-1">Parolalar eşleşmiyor</p>}
        </Field>
      </div>
    </div>
  );
}

function Step5({ form, update, plans }: { form: any; update: any; plans: Plan[] }) {
  const fallbackPlans: Plan[] = [
    { id: 'default', name: 'Varsayılan', slug: '', description: 'Standart platform komisyonu', monthlyFee: 0, commissionRate: 0.08, maxVehicles: null, maxRoutes: null, maxMonthlyBookings: null, features: ['Standart özellikler'], sortOrder: 0 },
  ];
  const available = plans.length > 0 ? plans : fallbackPlans;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Plan & Ödeme</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Platform komisyonu ve ödeme akışı.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 block">Plan</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {available.map((p) => {
            const selected = form.planSlug === p.slug;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => update('planSlug', p.slug)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-black text-slate-900 dark:text-white">{p.name}</p>
                <p className="text-xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">
                  %{(p.commissionRate * 100).toFixed(1)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Komisyon</p>
                {p.monthlyFee > 0 && (
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-1">+ ₺{p.monthlyFee}/ay</p>
                )}
                {p.description && <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium">{p.description}</p>}
                {p.features.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {p.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="text-[10px] text-slate-600 dark:text-zinc-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 block">Ödeme Modu</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { val: 'PLATFORM', title: 'Platform Hesabı (Önerilen)', desc: 'Ödemeler TransitIQ üzerinden toplanır, komisyon kesilip net tutar size EFT yapılır. Başlangıç için pratik.' },
            { val: 'OWN', title: 'Kendi Iyzico Hesabım', desc: 'Ödemeler direkt sizin Iyzico hesabınıza düşer. Komisyon faturayla tahsil edilir. Iyzico anahtarlarınızı sonra panelden girersiniz.' },
          ].map((o) => {
            const selected = form.iyzicoMode === o.val;
            return (
              <button
                key={o.val} type="button"
                onClick={() => update('iyzicoMode', o.val)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  selected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5' : 'border-slate-200 dark:border-zinc-800'
                }`}
              >
                <p className="text-sm font-black text-slate-900 dark:text-white">{o.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">{o.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step6({ form, update, plans }: { form: any; update: any; plans: Plan[] }) {
  const selectedPlan = plans.find((p) => p.slug === form.planSlug);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Gözden Geçir & Onayla</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Bilgilerini kontrol et, sözleşme ve KVKK'yı onayla.</p>
      </div>
      <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-2 text-sm">
        <Row label="Firma" value={form.companyName} />
        {form.publicName && <Row label="Gösterilen ad" value={form.publicName} />}
        <Row label="Slug" value={`/firma/${form.slug}`} />
        {form.taxId && <Row label="Vergi No" value={form.taxId} />}
        {form.uetdsLicense && <Row label="D Belgesi" value={form.uetdsLicense} />}
        <Row label="Admin" value={`${form.adminName} (${form.adminEmail})`} />
        <Row label="Plan" value={selectedPlan?.name || 'Varsayılan (%8)'} />
        <Row label="Ödeme" value={form.iyzicoMode === 'OWN' ? 'Kendi Iyzico hesabı' : 'Platform hesabı'} />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.acceptsTerms}
            onChange={(e) => update('acceptsTerms', e.target.checked)}
            className="mt-1 w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-sm text-slate-700 dark:text-zinc-300 font-medium">
            <Link href="/sartlar" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-bold underline">Kullanım Şartlarını</Link> okudum ve kabul ediyorum.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.acceptsKvkk}
            onChange={(e) => update('acceptsKvkk', e.target.checked)}
            className="mt-1 w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-sm text-slate-700 dark:text-zinc-300 font-medium">
            <Link href="/kvkk" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-bold underline">KVKK Aydınlatma Metnini</Link> okudum, kişisel verilerin işlenmesine onay veriyorum.
          </span>
        </label>
      </div>

      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/80 dark:border-emerald-500/20 p-3 flex gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
          Başvurun platform ekibi tarafından 1-2 iş günü içinde incelenir. Onaylandığında e-posta alırsın ve satış yapmaya başlayabilirsin.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-zinc-400 font-semibold text-xs">{label}</span>
      <span className="text-slate-900 dark:text-white font-bold text-xs text-right">{value}</span>
    </div>
  );
}
