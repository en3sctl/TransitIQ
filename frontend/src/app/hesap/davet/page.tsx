"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Share2, Users, TrendingUp, MessageCircle, Mail, Link as LinkIcon } from "lucide-react";
import { AccountLayout } from "@/components/hesap/account-layout";
import { toast } from "sonner";
import api from "@/lib/api";

interface Stats {
  referralsCount: number;
  totalEarned: number;
  recentReferrals: Array<{ id: string; name: string; createdAt: string }>;
}

export default function ReferralPage() {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([
          api.get('/referral/code'),
          api.get('/referral/stats'),
        ]);
        setCode(c.data.code);
        setStats(s.data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${code}` : '';

  async function copy(text: string, label: string = 'Kopyalandı') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopyalanamadı');
    }
  }

  const whatsappMsg = `TransitIQ ile otobüs biletini %50 daha hızlı alabilirsin. Davet kodumu kullan, ikimiz de 50₺ kredi kazanalım: ${shareUrl}`;

  return (
    <AccountLayout title="Arkadaş Davet Et" subtitle="Her davet ettiğin arkadaş için ikinize de 50₺ kredi.">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-3xl p-8 text-white overflow-hidden relative mb-6"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
            <Gift className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">Davet kodun hazır</h2>
          <p className="text-sm text-emerald-50/90 font-medium mb-5">Arkadaşın kayıt olup ilk biletini alınca <strong>ikinize de 50₺</strong> cüzdanınıza düşer.</p>

          <div className="flex items-center gap-2 p-2 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
            <code className="flex-1 text-xl md:text-2xl font-black tracking-widest text-white px-3 py-2">
              {loading ? '—' : code}
            </code>
            <button
              onClick={() => copy(code, 'Kod kopyalandı')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-xs hover:scale-[1.02] transition-transform"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Kopyala
            </button>
          </div>
        </div>
      </motion.div>

      {/* Share buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">WhatsApp</p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Mesaj olarak gönder</p>
          </div>
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent('TransitIQ davetim')}&body=${encodeURIComponent(whatsappMsg)}`}
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">E-posta</p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Adresine gönder</p>
          </div>
        </a>
        <button
          onClick={() => copy(shareUrl, 'Link kopyalandı')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl hover:border-rose-300 dark:hover:border-rose-700 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">Link Kopyala</p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Herhangi bir yere paylaş</p>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Davet Edilen</p>
          </div>
          <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stats?.referralsCount || 0}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Kazandığın</p>
          </div>
          <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
            ₺{stats?.totalEarned.toLocaleString('tr-TR') || '0'}
          </p>
        </div>
      </div>

      {/* Recent */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-zinc-800">
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Son Davetler</h2>
        </div>
        {!stats || stats.recentReferrals.length === 0 ? (
          <div className="p-10 text-center">
            <Share2 className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Henüz davet yok</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {stats.recentReferrals.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Kayıtlı
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
