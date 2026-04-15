import type { SeatData } from './seat-engine';

interface LayoutRow {
  rowIndex: number;
  seats: (SeatData | null)[];
  isBackRow?: boolean;
}

interface Layout {
  rows: LayoutRow[];
  leftCols: number;
  rightCols?: number;
}

/**
 * Finds the best "together" group of `count` seats in a bus layout.
 *
 * Strategy, in priority order:
 * 1. `count` consecutive available seats on the same side of the same row
 * 2. Pairs of adjacent rows with vertical alignment (e.g. window pair front+back)
 * 3. Seats close in seat-number (fallback)
 *
 * Skips null aisles, locked, booked seats.
 */
export function findAdjacentSeats(layout: Layout, count: number): number[] {
  if (count < 1) return [];
  const available = (s: SeatData | null) => !!s && s.status === 'available';

  // Strategy 1: single row, same side adjacent
  for (const row of layout.rows) {
    const left = row.seats.slice(0, layout.leftCols);
    const rightStart = layout.leftCols + 1; // +1 to skip aisle gap
    const right = row.seats.slice(rightStart);

    const leftAvail = left.filter(available) as SeatData[];
    const rightAvail = right.filter(available) as SeatData[];

    if (leftAvail.length >= count) return leftAvail.slice(0, count).map((s) => s.seatNumber);
    if (rightAvail.length >= count) return rightAvail.slice(0, count).map((s) => s.seatNumber);
  }

  // Strategy 2: 2 adjacent rows stacked (e.g. 4 people = 2x2)
  if (count >= 3 && count <= 4) {
    for (let i = 0; i < layout.rows.length - 1; i++) {
      const a = layout.rows[i];
      const b = layout.rows[i + 1];
      const perRow = Math.ceil(count / 2);
      const aLeft = a.seats.slice(0, layout.leftCols).filter(available) as SeatData[];
      const bLeft = b.seats.slice(0, layout.leftCols).filter(available) as SeatData[];
      if (aLeft.length >= perRow && bLeft.length >= (count - perRow)) {
        return [
          ...aLeft.slice(0, perRow).map((s) => s.seatNumber),
          ...bLeft.slice(0, count - perRow).map((s) => s.seatNumber),
        ];
      }
      const rightStart = layout.leftCols + 1;
      const aRight = a.seats.slice(rightStart).filter(available) as SeatData[];
      const bRight = b.seats.slice(rightStart).filter(available) as SeatData[];
      if (aRight.length >= perRow && bRight.length >= (count - perRow)) {
        return [
          ...aRight.slice(0, perRow).map((s) => s.seatNumber),
          ...bRight.slice(0, count - perRow).map((s) => s.seatNumber),
        ];
      }
    }
  }

  // Strategy 3: fallback — closest seat numbers
  const allAvail: SeatData[] = [];
  for (const row of layout.rows) {
    for (const seat of row.seats) {
      if (available(seat)) allAvail.push(seat as SeatData);
    }
  }
  allAvail.sort((a, b) => a.seatNumber - b.seatNumber);

  // Try to find the tightest cluster of `count` seats
  let best: SeatData[] = [];
  let bestSpread = Infinity;
  for (let i = 0; i <= allAvail.length - count; i++) {
    const chunk = allAvail.slice(i, i + count);
    const spread = chunk[chunk.length - 1].seatNumber - chunk[0].seatNumber;
    if (spread < bestSpread) {
      bestSpread = spread;
      best = chunk;
    }
  }

  return best.map((s) => s.seatNumber);
}
