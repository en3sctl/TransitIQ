import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Passenger, TripInfo } from '@/types/booking';

interface BookingStore {
  // Trip state
  trip: TripInfo | null;
  setTrip: (trip: TripInfo) => void;
  clearTrip: () => void;

  // Seat state
  selectedSeats: number[];
  addSeat: (seat: number) => void;
  removeSeat: (seat: number) => void;
  clearSeats: () => void;

  // Passenger state (1 passenger per seat)
  passengers: Passenger[];
  updatePassenger: (seatNumber: number, data: Partial<Passenger>) => void;

  // Contact info (shared across all passengers - buyer info)
  contactEmail: string;
  contactPhone: string;
  setContactEmail: (email: string) => void;
  setContactPhone: (phone: string) => void;

  // Computed
  totalPrice: () => number;

  // Reset
  reset: () => void;
}

const initialState = {
  trip: null,
  selectedSeats: [],
  passengers: [],
  contactEmail: '',
  contactPhone: '',
};

export const useBookingStore = create<BookingStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Trip actions
      setTrip: (trip) => set({ trip }, false, 'setTrip'),
      clearTrip: () => set({ trip: null }, false, 'clearTrip'),

      // Seat actions
      addSeat: (seat) =>
        set(
          (state) => {
            if (state.selectedSeats.includes(seat)) return state;
            const selectedSeats = [...state.selectedSeats, seat].sort((a, b) => a - b);
            const passengers = [
              ...state.passengers,
              {
                seatNumber: seat,
                tcKimlik: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
              },
            ].sort((a, b) => a.seatNumber - b.seatNumber);
            return { selectedSeats, passengers };
          },
          false,
          'addSeat'
        ),

      removeSeat: (seat) =>
        set(
          (state) => ({
            selectedSeats: state.selectedSeats.filter((s) => s !== seat),
            passengers: state.passengers.filter((p) => p.seatNumber !== seat),
          }),
          false,
          'removeSeat'
        ),

      clearSeats: () =>
        set({ selectedSeats: [], passengers: [] }, false, 'clearSeats'),

      // Passenger actions
      updatePassenger: (seatNumber, data) =>
        set(
          (state) => ({
            passengers: state.passengers.map((p) =>
              p.seatNumber === seatNumber ? { ...p, ...data } : p
            ),
          }),
          false,
          'updatePassenger'
        ),

      // Contact actions
      setContactEmail: (email) => set({ contactEmail: email }, false, 'setContactEmail'),
      setContactPhone: (phone) => set({ contactPhone: phone }, false, 'setContactPhone'),

      // Computed
      totalPrice: () => {
        const { trip, selectedSeats } = get();
        if (!trip) return 0;
        return selectedSeats.length * trip.basePrice;
      },

      // Reset
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'BookingStore' }
  )
);
