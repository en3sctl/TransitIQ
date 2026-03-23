'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateSeatLayout, type SeatData, type SeatStatus } from '@/lib/seat-engine';
import { useBookingStore } from '@/store/useBookingStore';

// ─── Seat Button ───
interface SeatButtonProps {
  seat: SeatData;
  isSelected: boolean;
  onToggle: (seatNumber: number) => void;
  compact?: boolean;
}

function statusConfig(status: SeatStatus, isSelected: boolean) {
  if (isSelected) {
    return {
      bg: 'bg-indigo-600 dark:bg-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-400/50',
      text: 'text-white font-black',
      cursor: 'cursor-pointer',
      hover: 'hover:bg-indigo-700 dark:hover:bg-indigo-600',
      disabled: false,
    };
  }
  switch (status) {
    case 'available':
      return {
        bg: 'bg-white dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700',
        text: 'text-slate-700 dark:text-zinc-300 font-bold',
        cursor: 'cursor-pointer',
        hover: 'hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30',
        disabled: false,
      };
    case 'sold':
      return {
        bg: 'bg-red-100 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900/50',
        text: 'text-red-300 dark:text-red-700 font-bold',
        cursor: 'cursor-not-allowed',
        hover: '',
        disabled: true,
      };
    case 'locked':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800/50',
        text: 'text-amber-400 dark:text-amber-600 font-bold',
        cursor: 'cursor-not-allowed',
        hover: '',
        disabled: true,
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-zinc-800',
        text: 'text-slate-400',
        cursor: 'cursor-not-allowed',
        hover: '',
        disabled: true,
      };
  }
}

function SeatButton({ seat, isSelected, onToggle, compact }: SeatButtonProps) {
  const config = statusConfig(seat.status, isSelected);
  const size = compact ? 'w-10 h-10 text-xs' : 'w-12 h-12 text-sm';

  return (
    <motion.button
      whileTap={config.disabled ? undefined : { scale: 0.9 }}
      whileHover={config.disabled ? undefined : { scale: 1.05 }}
      onClick={() => !config.disabled && onToggle(seat.seatNumber)}
      disabled={config.disabled}
      className={cn(
        size,
        'rounded-xl flex items-center justify-center transition-all duration-200 select-none',
        config.bg,
        config.text,
        config.cursor,
        config.hover,
        isSelected && 'shadow-lg shadow-indigo-500/25'
      )}
      aria-label={`Koltuk ${seat.seatNumber}${config.disabled ? ' (dolu)' : ''}`}
    >
      {seat.seatNumber}
    </motion.button>
  );
}

// ─── Aisle Gap ───
function AisleGap({ compact }: { compact?: boolean }) {
  const size = compact ? 'w-6' : 'w-8';
  return <div className={cn(size, 'flex-shrink-0')} />;
}

// ─── Main Seat Map Component ───
interface SeatMapProps {
  layoutType: string;
  totalSeats: number;
  seatStatuses?: Map<number, SeatStatus>;
  compact?: boolean;
  maxSelectable?: number;
}

export function SeatMap({
  layoutType,
  totalSeats,
  seatStatuses,
  compact = false,
  maxSelectable = 5,
}: SeatMapProps) {
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const addSeat = useBookingStore((s) => s.addSeat);
  const removeSeat = useBookingStore((s) => s.removeSeat);

  const layout = useMemo(
    () => generateSeatLayout(layoutType, totalSeats, seatStatuses),
    [layoutType, totalSeats, seatStatuses]
  );

  const handleToggle = useCallback(
    (seatNumber: number) => {
      if (selectedSeats.includes(seatNumber)) {
        removeSeat(seatNumber);
      } else if (selectedSeats.length < maxSelectable) {
        addSeat(seatNumber);
      }
    },
    [selectedSeats, addSeat, removeSeat, maxSelectable]
  );

  const seatSize = compact ? 'w-10 h-10' : 'w-12 h-12';
  const gap = compact ? 'gap-1.5' : 'gap-2';

  return (
    <div className="flex flex-col items-center">
      {/* Bus Front (Driver area) */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn(seatSize, 'rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center')}>
            <svg className="w-5 h-5 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Şoför</span>
        </div>
        <div className={cn(seatSize, 'rounded-xl bg-slate-100 dark:bg-zinc-800 border-2 border-dashed border-slate-300 dark:border-zinc-600 flex items-center justify-center')}>
          <svg className="w-5 h-5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
          </svg>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-zinc-700 to-transparent mb-4" />

      {/* Seat Grid */}
      <div className={cn('flex flex-col', gap)}>
        {layout.rows.map((row) => (
          <motion.div
            key={row.rowIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: row.rowIndex * 0.03, duration: 0.2 }}
            className={cn('flex items-center justify-center', gap, row.isBackRow && 'mt-2 pt-3 border-t-2 border-dashed border-slate-200 dark:border-zinc-700')}
          >
            {row.seats.map((seat, colIndex) =>
              seat === null ? (
                <AisleGap key={`aisle-${row.rowIndex}-${colIndex}`} compact={compact} />
              ) : (
                <SeatButton
                  key={seat.seatNumber}
                  seat={seat}
                  isSelected={selectedSeats.includes(seat.seatNumber)}
                  onToggle={handleToggle}
                  compact={compact}
                />
              )
            )}
          </motion.div>
        ))}
      </div>

      {/* Bus Rear Label */}
      <div className="mt-4 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
        Arka
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700" />
          <span className="text-slate-500 dark:text-zinc-400">Boş</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 dark:bg-indigo-500" />
          <span className="text-slate-500 dark:text-zinc-400">Seçili</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900/50" />
          <span className="text-slate-500 dark:text-zinc-400">Dolu</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800/50" />
          <span className="text-slate-500 dark:text-zinc-400">Rezerve</span>
        </div>
      </div>
    </div>
  );
}
