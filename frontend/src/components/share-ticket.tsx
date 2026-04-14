"use client";

import { useState } from "react";
import { MessageCircle, Mail, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  pnrCode: string;
  from: string;
  to: string;
  date: string;
  time: string;
  passengerName?: string;
  variant?: 'inline' | 'menu';
}

export function ShareTicket({ pnrCode, from, to, date, time, passengerName, variant = 'inline' }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = `TransitIQ Biletim\n\n${from} → ${to}\n${date} · ${time}${passengerName ? `\nYolcu: ${passengerName}` : ''}\nPNR: ${pnrCode}\n\nBilet takibi: https://transitiq.com/bilet-takip`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent('TransitIQ Biletim')}&body=${encodeURIComponent(shareText)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Panoya kopyalandı');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopyalanamadı');
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TransitIQ Biletim',
          text: shareText,
        });
      } catch {
        // cancelled
      }
    } else {
      copy();
    }
  }

  if (variant === 'menu') {
    return (
      <div className="grid grid-cols-3 gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold">WhatsApp</span>
        </a>
        <a
          href={mailtoUrl}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span className="text-[10px] font-bold">E-posta</span>
        </a>
        <button
          onClick={copy}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="text-[10px] font-bold">Kopyala</span>
        </button>
      </div>
    );
  }

  // Inline: single button with native share fallback
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-xs font-bold transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
      </a>
      <button
        onClick={nativeShare}
        aria-label="Paylaş"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" /> Paylaş
      </button>
    </div>
  );
}
