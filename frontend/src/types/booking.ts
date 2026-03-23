export interface Passenger {
  seatNumber: number;
  tcKimlik: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface TripInfo {
  tripId: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  busType: string;
  basePrice: number;
}
