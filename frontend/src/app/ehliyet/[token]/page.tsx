"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, FileText, Loader2, AlertTriangle, Clock } from "lucide-react";

function apiBase() { return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; }
function toAbs(u: string | null | undefined) {
  if (!u) return null;
  return u.startsWith('http') ? u : apiBase() + u;
}

const DOC_LABEL: Record<string, string> = {
  LICENSE: 'Sürücü Belgesi', SRC1: 'SRC1', SRC2: 'SRC2', SRC3: 'SRC3 (Yolcu)', SRC4: 'SRC4 (Yurtdışı)',
  PSYCHOTECH: 'Psikoteknik', HEALTH_REPORT: 'Sağlık Raporu', CRIMINAL_RECORD: 'Adli Sicil',
};

interface Wallet {
  driver: { name: string; avatarUrl: string | null; tenantName: string };
  documents: Array<{
    type: string;
    licenseClass: string | null;
    documentNumber: string | null;
    issuedAt: string | null;
    validUntil: string | null;
    imageUrl: string | null;
  }>;
  generatedAt: string;
  expiresAt: string;
}

export default function DriverWalletPublicPage() {
  const params = useParams<{ token: string }>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.token) return;
    fetch(`${apiBase()}/driver-wallet/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: 'Hata' }));
          throw new Error(body.message || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setWallet(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Geçersiz veya Süresi Geçmiş Kod</h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {error || 'QR kodu yanlış veya süresi doldu. Şoförden yeni kod talep edin.'}
          </p>
        </div>
      </div>
    );
  }

  const expiresIn = Math.max(0, Math.floor((new Date(wallet.expiresAt).getTime() - Date.now()) / 60000));

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 text-center">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-90" />
        <h1 className="text-2xl font-black tracking-tight">Dijital Belge Cüzdanı</h1>
        <p className="text-sm opacity-85 font-medium mt-1">TransitIQ · {wallet.driver.tenantName}</p>
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
          <Clock className="w-3 h-3" /> {expiresIn > 0 ? `${expiresIn} dakika geçerli` : 'Süresi doldu'}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Driver card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-4xl font-black text-indigo-700 overflow-hidden">
              {toAbs(wallet.driver.avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={toAbs(wallet.driver.avatarUrl)!} alt={wallet.driver.name} className="w-full h-full object-cover" />
              ) : (
                wallet.driver.name[0]?.toUpperCase() || '?'
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Şoför</p>
              <p className="text-xl font-black tracking-tight text-slate-900">{wallet.driver.name}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{wallet.driver.tenantName}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-2">
          {wallet.documents.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-slate-500">Belge yüklenmemiş</p>
            </div>
          ) : (
            wallet.documents.map((d) => {
              const validUntil = d.validUntil ? new Date(d.validUntil) : null;
              const expired = validUntil && validUntil < new Date();
              return (
                <div key={d.type} className={`bg-white rounded-2xl p-4 border-2 ${expired ? 'border-rose-300' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-slate-900">{DOC_LABEL[d.type] || d.type}</p>
                        {d.licenseClass && (
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            Sınıf {d.licenseClass}
                          </span>
                        )}
                        {expired && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                            Süresi geçmiş
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {d.documentNumber && <span>No: {d.documentNumber} · </span>}
                        {validUntil && <span>Geçerli: {validUntil.toLocaleDateString('tr-TR')}</span>}
                      </div>
                    </div>
                  </div>
                  {toAbs(d.imageUrl) && (
                    <a href={toAbs(d.imageUrl)!} target="_blank" rel="noreferrer">
                      {d.imageUrl?.endsWith('.pdf') ? (
                        <div className="bg-slate-100 rounded-xl p-6 text-center hover:bg-slate-200">
                          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-600">PDF'i aç</p>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={toAbs(d.imageUrl)!}
                          alt={DOC_LABEL[d.type]}
                          className="w-full rounded-xl border border-slate-200"
                        />
                      )}
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>

        <p className="text-[10px] text-slate-400 font-medium text-center mt-6">
          Oluşturuldu: {new Date(wallet.generatedAt).toLocaleString('tr-TR')} · TransitIQ Ehliyet Cüzdanı
        </p>
      </div>
    </div>
  );
}
