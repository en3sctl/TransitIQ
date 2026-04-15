"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Gift, RotateCcw, Percent, Sparkles, Info } from "lucide-react";
import { AccountLayout } from "@/components/hesap/account-layout";
import api from "@/lib/api";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reason: string | null;
  bookingId: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  REFERRAL: { label: 'Arkadaş Daveti', icon: Gift, color: 'emerald' },
  REFUND: { label: 'Bilet İadesi', icon: RotateCcw, color: 'indigo' },
  PROMOTION: { label: 'Kampanya', icon: Percent, color: 'rose' },
  ADJUSTMENT: { label: 'Düzeltme', icon: Info, color: 'amber' },
  PAYMENT: { label: 'Bilet Ödemesi', icon: ArrowDownCircle, color: 'slate' },
};

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  slate: 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400',
};

function fDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, t] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/wallet/transactions'),
        ]);
        setBalance(b.data.balance);
        setTxs(t.data);
      } catch {
        setBalance(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalEarned = txs.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalSpent = Math.abs(txs.filter((t) => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0));

  return (
    <AccountLayout title="Cüzdan" subtitle="TransitIQ kredilerin, iade ve kampanya bakiyen.">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white overflow-hidden mb-6"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 opacity-80" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Mevcut Bakiye</p>
          </div>
          <p className="text-5xl md:text-6xl font-black tracking-tighter mb-2">
            {loading ? '—' : `₺${balance?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
          <p className="text-sm text-indigo-100 font-medium">Bir sonraki biletinde otomatik kullanılır</p>
        </div>
      </motion.div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Toplam Kazanç</p>
          </div>
          <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
            ₺{totalEarned.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Toplam Kullanım</p>
          </div>
          <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
            ₺{totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* How to earn */}
      {totalEarned === 0 && !loading && (
        <div className="bg-gradient-to-br from-emerald-50 to-indigo-50 dark:from-emerald-500/10 dark:to-indigo-500/10 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Nasıl kredi kazanılır?</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium leading-relaxed mb-1">
                Arkadaşını davet et, ikinize de <strong>50₺</strong> kredi. İptal ettiğin biletler de otomatik cüzdana yansır.
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-semibold italic">
                Kayıtta referans kodu girdiysen, <strong>ilk biletini aldığında</strong> bonus cüzdanına yansır — hem sana hem seni davet eden arkadaşına.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-zinc-800">
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">İşlem Geçmişi</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer h-14 rounded-xl" />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Henüz işlem yok</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {txs.map((tx) => {
              const meta = TYPE_LABELS[tx.type] || { label: tx.type, icon: Info, color: 'slate' };
              const Icon = meta.icon;
              const positive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-4 p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${COLOR_CLASSES[meta.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{meta.label}</p>
                    {tx.reason && <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">{tx.reason}</p>}
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{fDate(tx.createdAt)}</p>
                  </div>
                  <p className={`text-base font-black tracking-tighter ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {positive ? '+' : ''}₺{Math.abs(Number(tx.amount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
