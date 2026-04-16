'use client';

import { useEffect, useState } from 'react';
import { Star, MessageSquareQuote, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
  author: string;
}

const TAG_LABELS: Record<string, string> = {
  CLEAN: 'Temiz',
  ON_TIME: 'Dakik',
  FRIENDLY: 'Güleryüzlü',
  COMFORTABLE: 'Konforlu',
  RUDE: 'İlgisiz',
  LATE: 'Gecikmeli',
  DIRTY: 'Kirli',
  VALUE: 'Uygun fiyat',
};

export function TripReviews({ tripId }: { tripId: string }) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/booking/trips/${tripId}/reviews`, { params: { take: 5 } });
        if (aborted) return;
        setReviews(res.data?.reviews || []);
        setAvg(res.data?.averageRating || 0);
        setTotal(res.data?.totalCount || 0);
      } catch {
        if (!aborted) setReviews([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => { aborted = true; };
  }, [tripId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Yorumlar yükleniyor...
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareQuote className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Yolcu Yorumları</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          Bu şoför için henüz yorum yok. İlk yorumu sen yaparsan diğer yolculara yardımcı olursun.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Yolcu Yorumları</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="text-xs font-black text-amber-700 dark:text-amber-400">{avg.toFixed(1)}</span>
          <span className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/60">({total})</span>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border-l-2 border-slate-100 dark:border-zinc-800 pl-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200 dark:text-zinc-700'}`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">{r.author}</span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {r.comment && (
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">{r.comment}</p>
            )}
            {r.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-md"
                  >
                    {TAG_LABELS[t] || t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
