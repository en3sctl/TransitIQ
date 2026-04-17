"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck, Loader2, AlertTriangle, Copy, CheckCircle2, Key, Smartphone } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Status {
  enabled: boolean;
  enabledAt: string | null;
  lastUsedAt: string | null;
  backupCodesRemaining: number;
}

export function Security2FAPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string; otpauth: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/security/2fa/status');
      setStatus(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const begin = async () => {
    setBusy(true);
    try {
      const res = await api.post('/security/2fa/setup', {});
      setSetupData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Başlatılamadı');
    } finally { setBusy(false); }
  };

  const verify = async () => {
    if (code.length !== 6) { toast.error('6 haneli kod gir'); return; }
    setBusy(true);
    try {
      const res = await api.post('/security/2fa/verify', { code });
      setBackupCodes(res.data.backupCodes);
      toast.success('2FA aktif edildi');
      setSetupData(null);
      setCode('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kod hatalı');
    } finally { setBusy(false); }
  };

  const disable = async () => {
    const c = prompt('Mevcut 2FA kodunu gir (doğrulama için):');
    if (!c) return;
    setBusy(true);
    try {
      await api.post('/security/2fa/disable', { code: c });
      toast.success('2FA kapatıldı');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    } finally { setBusy(false); }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Kopyalandı'); } catch { toast.info(text); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  // Backup codes shown once after setup
  if (backupCodes) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-3">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-lg font-black">2FA Aktif Edildi</h3>
          </div>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium mb-4 leading-relaxed">
            <strong>Yedek kodları şimdi güvenli bir yere kaydet.</strong> Telefonunu kaybedersen bu kodlarla giriş yapabilirsin. Her kod <strong>tek kullanımlıktır</strong> ve bir daha gösterilmez.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {backupCodes.map((c, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-500/40 rounded-lg p-2 font-mono text-center text-sm font-bold">
                {c}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => copy(backupCodes.join('\n'))} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
              <Copy className="w-3.5 h-3.5" /> Hepsini Kopyala
            </button>
            <button onClick={() => setBackupCodes(null)} className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 text-xs font-bold">Kaydettim</button>
          </div>
        </div>
      </div>
    );
  }

  // Setup in progress
  if (setupData) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(setupData.otpauth)}`;
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">2FA Kurulumu</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Google Authenticator, Authy, 1Password gibi bir uygulamayla QR kodu tara.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR" className="w-[240px] h-[240px]" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Manuel giriş için gizli anahtar</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                <code className="flex-1 font-mono text-sm font-bold text-slate-900 dark:text-white break-all">{setupData.secret}</code>
                <button onClick={() => copy(setupData.secret)} className="p-1.5 rounded hover:bg-slate-200"><Copy className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Uygulamada görünen 6 haneli kodu gir</p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-2xl font-black tracking-[0.5em] text-center font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={verify} disabled={busy || code.length !== 6} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Doğrula & Aktif Et
              </button>
              <button onClick={() => setSetupData(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-sm font-bold">İptal</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl p-6 border ${status?.enabled ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${status?.enabled ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
            {status?.enabled ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {status?.enabled ? 'İki Adımlı Doğrulama Aktif' : 'İki Adımlı Doğrulama Kapalı'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">
              {status?.enabled
                ? `${status.enabledAt ? new Date(status.enabledAt).toLocaleDateString('tr-TR') + '\'den beri aktif' : 'Aktif'} · ${status.backupCodesRemaining} yedek kod kaldı`
                : 'Hesabını ekstra güvenlik katmanıyla koru. Önerilen.'}
            </p>
          </div>
          {status?.enabled ? (
            <button onClick={disable} disabled={busy} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50">
              2FA'yı Kapat
            </button>
          ) : (
            <button onClick={begin} disabled={busy} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Kurulum Başlat
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
        <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-500" /> Nasıl Çalışır?
        </h4>
        <ol className="space-y-2 text-sm text-slate-600 dark:text-zinc-400 font-medium list-decimal list-inside">
          <li>Kurulum başlat, uygulama QR kod verir</li>
          <li>Google Authenticator / Authy / 1Password ile QR'ı tara</li>
          <li>Uygulama 30 saniyede bir değişen 6 haneli kod üretir</li>
          <li>Her giriş'te parolana ek olarak bu kodu girersin</li>
          <li>Telefonunu kaybedersen yedek kodlarla giriş yapabilirsin</li>
        </ol>
      </div>

      {status?.enabled && status.backupCodesRemaining < 3 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 p-3 flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            <strong>Sadece {status.backupCodesRemaining} yedek kodun kaldı.</strong> 2FA'yı kapatıp yeniden aç, yeni yedek kodlar alırsın.
          </p>
        </div>
      )}
    </div>
  );
}
