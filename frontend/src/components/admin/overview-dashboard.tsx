"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Minus, Bus, CalendarDays, Activity,
  Target, AlertCircle, DollarSign, Ticket, ArrowUpRight, ArrowDownRight,
  Loader2, Download, FileText, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Dashboard {
  revenue: {
    today: { value: number; count: number; changePct: number };
    week: { value: number; count: number; changePct: number };
    month: { value: number; count: number; changePct: number };
    total: { value: number; count: number };
  };
  daily: { date: string; revenue: number; count: number }[];
  hourlyMatrix: number[][];
  topRoutes: { origin: string; destination: string; bookings: number; revenue: number }[];
  topDrivers: { name: string; count: number }[];
  fleet: { total: number; active: number; utilizationPct: number };
  trips: { active: number; completed: number };
  metrics: { avgTicketPrice: number; cancellationRate: number; cancelledCount: number };
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun order (API returns Sun=0)

function fPrice(v: number) {
  return `₺${v.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
}

export function OverviewDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'30' | '60' | '90'>('30');

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const dailyWindow = useMemo(() => {
    if (!data?.daily) return [];
    const n = Number(range);
    return data.daily.slice(-n);
  }, [data, range]);

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-sm font-bold text-zinc-500">Veriler yüklenemedi</div>;
  }

  const maxDailyRev = Math.max(...dailyWindow.map(d => d.revenue), 1);
  const heatmapMax = Math.max(...data.hourlyMatrix.flat(), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* KPI Grid — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Bugün"
          value={fPrice(data.revenue.today.value)}
          subtitle={`${data.revenue.today.count} bilet`}
          changePct={data.revenue.today.changePct}
          color="indigo"
          icon={DollarSign}
        />
        <KPICard
          label="Bu Hafta"
          value={fPrice(data.revenue.week.value)}
          subtitle={`${data.revenue.week.count} bilet`}
          changePct={data.revenue.week.changePct}
          color="emerald"
          icon={TrendingUp}
        />
        <KPICard
          label="Bu Ay"
          value={fPrice(data.revenue.month.value)}
          subtitle={`${data.revenue.month.count} bilet`}
          changePct={data.revenue.month.changePct}
          color="amber"
          icon={CalendarDays}
        />
        <KPICard
          label="Toplam Ciro"
          value={fPrice(data.revenue.total.value)}
          subtitle={`${data.revenue.total.count} bilet`}
          color="rose"
          icon={Target}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Ciro Trendi</h3>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Günlük gelir dağılımı</p>
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(['30', '60', '90'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  range === r ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}>
                {r}G
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-[2px] h-40">
            {dailyWindow.map((d, i) => {
              const h = Math.max(2, (d.revenue / maxDailyRev) * 100);
              const isToday = i === dailyWindow.length - 1;
              return (
                <div key={d.date} className="flex-1 group relative cursor-pointer">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isToday ? 'bg-indigo-600 dark:bg-indigo-500' :
                      d.revenue > 0 ? 'bg-indigo-200 dark:bg-indigo-500/30 hover:bg-indigo-400 dark:hover:bg-indigo-500/60' :
                      'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                    <div className="font-black">{fPrice(d.revenue)}</div>
                    <div className="text-zinc-400 text-[9px]">{d.count} bilet · {new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
            <span>{new Date(dailyWindow[0]?.date || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
            <span>Bugün</span>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Ort. Bilet Fiyatı" value={fPrice(data.metrics.avgTicketPrice)} icon={Ticket} color="indigo" />
        <MiniStat label="İptal Oranı" value={`%${data.metrics.cancellationRate}`} icon={AlertCircle} color={data.metrics.cancellationRate > 10 ? 'rose' : 'emerald'} />
        <MiniStat label="Aktif Sefer" value={data.trips.active.toString()} icon={Activity} color="emerald" />
        <MiniStat label="Filo Kullanımı" value={`%${data.fleet.utilizationPct}`} icon={Bus} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Heatmap */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800">
            <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Satış Yoğunluk Haritası</h3>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Son 30 gün — saat ve güne göre</p>
          </div>
          <div className="p-5 overflow-x-auto">
            <div className="flex gap-1 min-w-[600px]">
              <div className="flex flex-col gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider pt-4">
                {DAYS.map(d => (
                  <div key={d} className="h-5 flex items-center justify-end pr-1">{d}</div>
                ))}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-24 gap-1 mb-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className={`text-[8px] font-bold text-center ${h % 3 === 0 ? 'text-zinc-500' : 'text-transparent'}`}>
                      {h}
                    </div>
                  ))}
                </div>
                {DAY_ORDER.map(dayIdx => (
                  <div key={dayIdx} className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const count = data.hourlyMatrix[dayIdx][h];
                      const intensity = count / heatmapMax;
                      return (
                        <div key={h} className="h-5 rounded-sm relative group cursor-pointer transition-all hover:scale-125 hover:z-10"
                          style={{
                            backgroundColor: count === 0
                              ? 'rgb(244 244 245 / 0.5)'
                              : `rgba(79, 70, 229, ${0.15 + intensity * 0.85})`,
                          }}
                          title={`${DAYS[DAY_ORDER.indexOf(dayIdx)]} ${h}:00 — ${count} bilet`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Daha az</span>
              <div className="flex items-center gap-1">
                {[0.15, 0.35, 0.55, 0.75, 1].map(o => (
                  <div key={o} className="w-5 h-3 rounded-sm" style={{ backgroundColor: `rgba(79, 70, 229, ${o})` }} />
                ))}
              </div>
              <span>Daha çok</span>
            </div>
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white">En Çok Kazandıran Rotalar</h3>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Son 30 gün</p>
            </div>
            <button onClick={() => onNavigate?.('routes')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Tümü →</button>
          </div>
          <div className="p-2">
            {data.topRoutes.length === 0 ? (
              <p className="p-5 text-sm text-zinc-400 text-center font-semibold">Henüz veri yok</p>
            ) : (
              data.topRoutes.map((r, i) => {
                const maxRev = Math.max(...data.topRoutes.map(x => x.revenue), 1);
                const pct = (r.revenue / maxRev) * 100;
                return (
                  <div key={i} className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                          i === 0 ? 'bg-amber-500 text-white' :
                          i === 1 ? 'bg-zinc-400 text-white' :
                          i === 2 ? 'bg-orange-700 text-white' :
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>{i + 1}</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{r.origin} <span className="text-indigo-500">→</span> {r.destination}</span>
                      </div>
                      <span className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">{fPrice(r.revenue)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-1">{r.bookings} bilet</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Drivers leaderboard + Fleet health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Sürücü Performansı</h3>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Son 30 günde en çok bilet taşıyanlar</p>
            </div>
            <button onClick={() => onNavigate?.('drivers')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Tümü →</button>
          </div>
          <div className="p-3">
            {data.topDrivers.length === 0 ? (
              <p className="p-5 text-sm text-zinc-400 text-center font-semibold">Henüz veri yok</p>
            ) : (
              data.topDrivers.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                    i === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-white' :
                    i === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-800 text-white' :
                    'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                  }`}>
                    {d.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{d.name}</p>
                    <p className="text-[10px] font-semibold text-zinc-400">{d.count} bilet taşıdı</p>
                  </div>
                  {i === 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 uppercase tracking-widest">🏆 En İyi</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fleet Health */}
        <div className="bg-zinc-950 border-none shadow-2xl rounded-2xl overflow-hidden relative">
          <div className="absolute -top-20 -right-20 opacity-5">
            <Bus size={240} strokeWidth={2} />
          </div>
          <div className="p-5 border-b border-zinc-800 relative z-10">
            <h3 className="text-base font-black text-white">Filo & Operasyon</h3>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Canlı sistem durumu</p>
          </div>
          <div className="p-5 space-y-5 relative z-10">
            <HealthMetric label="Araç Aktif" value={data.fleet.active} total={data.fleet.total} color="emerald" />
            <HealthMetric label="Aktif Sefer" value={data.trips.active} total={data.trips.active + data.trips.completed} color="indigo" />
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-black text-white tracking-tighter">{data.trips.completed}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tamamlanan Sefer</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white tracking-tighter">{data.metrics.cancelledCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Son 30g İptal</p>
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tüm Sistemler Çalışıyor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Muhasebe / KDV */}
      <TaxReportCard />
    </motion.div>
  );
}

function TaxReportCard() {
  const [tax, setTax] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/analytics/tax').then(r => setTax(r.data)).catch(() => setTax(null)).finally(() => setLoading(false));
  }, []);

  const exportMonthly = async () => {
    setExporting(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const res = await api.get('/booking/admin/bookings', {
        params: {
          status: 'CONFIRMED',
          from: monthStart.toISOString(),
          to: now.toISOString(),
          take: 10000,
          skip: 0,
        },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.bookings || [];
      if (list.length === 0) {
        toast.info('Bu ay için kayıt yok');
        return;
      }
      const rows: string[][] = list.map((b: any) => {
        const gross = Number(b.pricePaid);
        const net = gross / 1.20;
        const vat = gross - net;
        return [
          b.pnrCode || '',
          b.passengerName || '',
          b.passengerTcNo || '',
          new Date(b.bookingTime).toLocaleDateString('tr-TR'),
          net.toFixed(2).replace('.', ','),
          vat.toFixed(2).replace('.', ','),
          gross.toFixed(2).replace('.', ','),
          b.trip?.origin?.city || b.trip?.route?.originStation?.city || '',
          b.trip?.destination?.city || b.trip?.route?.destinationStation?.city || '',
        ];
      });
      const headers = ['PNR', 'Yolcu', 'TC', 'Tarih', 'Net (TL)', 'KDV %20 (TL)', 'Brüt (TL)', 'Kalkış', 'Varış'];
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `muhasebe_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success(`${list.length} kayıt CSV olarak indirildi`);
    } catch (e: any) {
      console.error('CSV export error:', e);
      toast.error(e.response?.data?.message || 'İndirilemedi');
    }
    finally { setExporting(false); }
  };

  if (loading || !tax) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-500" />
            Muhasebe & KDV
          </h3>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Otomatik vergi hesabı (%{(tax.vatRate * 100).toFixed(0)})</p>
        </div>
        <button onClick={exportMonthly} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50">
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Aylık Muhasebe Raporu (CSV)
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Bu Ay</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">Net Tutar</span>
              <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">₺{tax.month.net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">KDV (%{(tax.vatRate * 100).toFixed(0)})</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">₺{tax.month.vat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Brüt</span>
              <span className="text-base font-black text-zinc-900 dark:text-white tabular-nums">₺{tax.month.gross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[10px] font-semibold text-zinc-400 pt-1">{tax.month.bookings} bilet</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Yıl Başından Bugüne</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">Net Tutar</span>
              <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">₺{tax.year.net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">KDV (%{(tax.vatRate * 100).toFixed(0)})</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">₺{tax.year.vat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Brüt</span>
              <span className="text-base font-black text-zinc-900 dark:text-white tabular-nums">₺{tax.year.gross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[10px] font-semibold text-zinc-400 pt-1">{tax.year.bookings} bilet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, subtitle, changePct, color, icon: Icon }: { label: string; value: string; subtitle: string; changePct?: number; color: string; icon: any }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };
  const TrendIcon = changePct === undefined ? null : changePct > 0 ? ArrowUpRight : changePct < 0 ? ArrowDownRight : Minus;
  const trendColor = changePct === undefined ? '' : changePct > 0 ? 'text-emerald-600 dark:text-emerald-400' : changePct < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400';
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${cls[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {TrendIcon && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-black ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {Math.abs(changePct!).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">{value}</p>
      <p className="text-[10px] font-semibold text-zinc-500 mt-1">{subtitle}</p>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${cls[color]} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
        <p className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function HealthMetric({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  const barCls: Record<string, string> = {
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-300">{label}</span>
        <span className="text-xs font-black text-white">{value}/{total}</span>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${barCls[color]} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
