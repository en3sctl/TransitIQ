/**
 * Server-side landing data fetcher.
 *
 * Çağıran: app/page.tsx (async RSC). Tek bir Promise.all ile tüm landing
 * payload'ı paralel çekilir; LiveTicker / HeroBadge / PopularRoutes / CheapTrips
 * client component'lerine `initial...` prop'u olarak geçer.
 *
 * Bu pattern öncesinde her component kendi useEffect'inde fetch yapıyordu —
 * LiveTicker ve HeroBadge aynı endpoint'i (stats) iki kez çağırıyordu.
 * Şimdi tek istek + hydration anında veri hazır → CLS yok, kasma yok.
 */

export interface LandingStats {
  routes: number;
  trips: number;
  upcomingTrips: number;
  confirmedBookings: number;
  tenants: number;
  cities: number;
  newRoutes30d?: number;
  newCities30d?: number;
}

export interface LandingPopularRoute {
  id: string;
  origin: { city: string; name: string };
  destination: { city: string; name: string };
  price: number;
  distanceKm: number;
  bookingCount: number;
  tripCount: number;
  nextDeparture: string | null;
}

export interface LandingCheapTrip {
  id: string;
  origin: { city: string; name: string };
  destination: { city: string; name: string };
  price: number;
  departureTime: string;
  estimatedArrival: string | null;
  distanceKm: number | null;
  tenant: { name: string; slug: string };
  vehicle: { registrationPlate: string; model: string | null } | null;
  bookingCount: number;
}

export interface LandingData {
  stats: LandingStats | null;
  popularRoutes: LandingPopularRoute[];
  cheapTrips: LandingCheapTrip[];
}

const apiBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      // Public, hızla bayatlamayan veri — 60 sn ISR yeterli.
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getLandingData(): Promise<LandingData> {
  const [stats, popularRoutes, cheapTrips] = await Promise.all([
    safeFetch<LandingStats | null>('/routes/public/stats', null),
    safeFetch<LandingPopularRoute[]>('/routes/public/popular?limit=8', []),
    safeFetch<LandingCheapTrip[]>('/trips/public/cheap?limit=6', []),
  ]);
  return { stats, popularRoutes, cheapTrips };
}