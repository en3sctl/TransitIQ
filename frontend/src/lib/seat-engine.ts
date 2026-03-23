/**
 * TransitIQ Dynamic Seat Map Engine
 *
 * Generates seat layouts mathematically from Bus.layoutType and Bus.totalSeats.
 * Supports: "2+1", "2+2", "1+1"
 * No hardcoding. Every layout is computed.
 */

export type SeatStatus = 'available' | 'locked' | 'sold' | 'selected';

export interface SeatData {
  seatNumber: number;
  row: number;
  col: number;
  status: SeatStatus;
  isAisle?: boolean;
  isDriver?: boolean;
  isDoor?: boolean;
}

export interface SeatRow {
  rowIndex: number;
  seats: (SeatData | null)[]; // null = aisle gap
  isBackRow?: boolean;
}

export interface SeatLayout {
  rows: SeatRow[];
  totalColumns: number; // including aisle
  leftCols: number;
  rightCols: number;
  totalSeats: number;
}

/**
 * Parse layout type string into left/right seat counts
 * "2+1" → { left: 2, right: 1 }
 * "2+2" → { left: 2, right: 2 }
 * "1+1" → { left: 1, right: 1 }
 */
function parseLayoutType(layoutType: string): { left: number; right: number } {
  const parts = layoutType.split('+').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) {
    return { left: 2, right: 1 }; // safe default
  }
  return { left: parts[0], right: parts[1] };
}

/**
 * Generate complete seat layout
 *
 * Logic:
 * 1. Calculate seats per regular row (left + right)
 * 2. Calculate number of regular rows and back row
 * 3. Back row spans the full width (left + right + 1 for aisle seat)
 * 4. Assign seat numbers sequentially: left-to-right, front-to-back
 */
export function generateSeatLayout(
  layoutType: string,
  totalSeats: number,
  seatStatuses?: Map<number, SeatStatus>
): SeatLayout {
  const { left, right } = parseLayoutType(layoutType);
  const seatsPerRow = left + right;
  const totalColumns = left + 1 + right; // +1 for aisle

  // Back row fills entire width
  const backRowCapacity = totalColumns;
  const regularSeats = totalSeats - backRowCapacity;
  const regularRows = Math.ceil(Math.max(0, regularSeats) / seatsPerRow);

  // If total seats doesn't fill the back row fully, adjust
  const seatsInRegularRows = regularRows * seatsPerRow;
  const seatsInBackRow = totalSeats - seatsInRegularRows;

  const rows: SeatRow[] = [];
  let seatNumber = 1;

  // Generate regular rows
  for (let r = 0; r < regularRows; r++) {
    const rowSeats: (SeatData | null)[] = [];

    // Left side seats
    for (let c = 0; c < left; c++) {
      const status = seatStatuses?.get(seatNumber) ?? 'available';
      rowSeats.push({
        seatNumber,
        row: r,
        col: c,
        status,
      });
      seatNumber++;
    }

    // Aisle
    rowSeats.push(null);

    // Right side seats
    for (let c = 0; c < right; c++) {
      const status = seatStatuses?.get(seatNumber) ?? 'available';
      rowSeats.push({
        seatNumber,
        row: r,
        col: left + 1 + c,
        status,
      });
      seatNumber++;
    }

    rows.push({ rowIndex: r, seats: rowSeats });
  }

  // Generate back row (spans full width)
  if (seatsInBackRow > 0) {
    const backSeats: (SeatData | null)[] = [];
    for (let c = 0; c < totalColumns; c++) {
      if (seatNumber <= totalSeats) {
        const status = seatStatuses?.get(seatNumber) ?? 'available';
        backSeats.push({
          seatNumber,
          row: regularRows,
          col: c,
          status,
        });
        seatNumber++;
      } else {
        backSeats.push(null);
      }
    }
    rows.push({ rowIndex: regularRows, seats: backSeats, isBackRow: true });
  }

  return {
    rows,
    totalColumns,
    leftCols: left,
    rightCols: right,
    totalSeats,
  };
}
