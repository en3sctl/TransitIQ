"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Trash2, Edit, ShieldOff, CheckCircle2, Loader2, AlertTriangle, FileLock } from "lucide-react";
import { toast } from "sonner";
import { AccountLayout } from "@/components/hesap/account-layout";
import api from "@/lib/api";

const TYPES = [
  { value: 'EXPORT', icon: Download, label: 'Verilerimi İndir', desc: 'Hakkımdaki tüm verileri JSON olarak al' },
  { value: 'DELETE', icon: Trash2, label: 'Hesabımı Sil', desc: 'Tüm kişisel verilerim anonimize edilsin', warning: true },
  { value: 'CORRECT', icon: Edit, label: 'Veri Düzelt', desc: 'Hatalı bir veriyi düzeltmek istiyorum' },
  { value: 'RESTRICT', icon: ShieldOff, label: 'İşlemeyi Kısıtla', desc: 'Verilerimin işlenmesini kısıtla' },
];

export default function KvkkRequestPage() {
  const [form, setForm] = useState({ type: '', contactEmail: '', contactName: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) { toast.error('Talep türü seç'); return; }
    if (!form.contactEmail || !form.contactName) { toast.error('İsim ve e-posta gerekli'); return; }
    setSubmitting(true);
    try {
      await api.post('/kvkk/requests', form);
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gönderilemedi');
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <AccountLayout title="KVKK Veri Talebi" subtitle="Talebin alındı">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-10 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black tracking-tight mb-2">Talebin bize ulaştı</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-md mx-auto">
            KVKK talepleri <strong>30 gün içinde</strong> yasal sürede cevaplanır. İşlem tamamlandığında sana e-posta atacağız.
          </p>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="KVKK Haklarım"
      subtitle="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki haklarını kullan."
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 p-4 flex gap-3">
          <FileLock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-indigo-900 dark:text-indigo-200">Yasal Hakların</p>
            <p className="text-xs text-indigo-800 dark:text-indigo-300/90 font-medium mt-1 leading-relaxed">
              Verilerine erişim, düzeltme, silme ve işlemeyi kısıtlama hakkın var. Talebinizi <strong>30 gün içinde</strong> yanıtlamak yasal zorunluluğumuz.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3 block">Talep Türü</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const selected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      selected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5' :
                      t.warning ? 'border-rose-200 dark:border-rose-500/30 hover:border-rose-400' :
                      'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${t.warning ? 'text-rose-500' : 'text-indigo-500'}`} />
                    <p className="text-sm font-black">{t.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-1">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {form.type === 'DELETE' && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 p-3 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                <strong>Dikkat:</strong> Silme işlemi geri alınamaz. Kişisel verilerin anonimize edilir, bilet geçmişin (yasal saklama için) maskelenmiş olarak saklanır.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Ad Soyad</label>
              <input required value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">E-posta</label>
              <input required type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Açıklama (opsiyonel)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={4}
              maxLength={2000}
              placeholder={form.type === 'CORRECT' ? 'Hangi veriyi düzeltmek istiyorsun?' : 'Talep detayları, varsa...'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.type}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileLock className="w-4 h-4" />}
            Talebi Gönder
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}
