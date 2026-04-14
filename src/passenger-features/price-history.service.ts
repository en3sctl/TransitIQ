import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Price history for a city pair.
 * Derived from:
 * 1. Historical booking data (real prices paid)
 * 2. Current listed prices (for comparison)
 */
@Injectable()
export class PriceHistoryService {
  constructor(private prisma: PrismaService) {}

  async forCityPair(originCity: string, destinationCity: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        bookingTime: { gte: since },
        trip: {
          route: {
            originStation: { city: { equals: originCity, mode: 'insensitive' } },
            destinationStation: { city: { equals: destinationCity, mode: 'insensitive' } },
          },
        },
      },
      select: { pricePaid: true, bookingTime: true },
      orderBy: { bookingTime: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, number[]>();
    for (const b of bookings) {
      const key = b.bookingTime.toISOString().slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(Number(b.pricePaid));
    }

    const history: Array<{ date: string; min: number; avg: number; max: number; count: number }> = [];
    for (const [date, prices] of byDay) {
      history.push({
        date,
        min: Math.min(...prices),
        avg: prices.reduce((s, p) => s + p, 0) / prices.length,
        max: Math.max(...prices),
        count: prices.length,
      });
    }
    history.sort((a, b) => a.date.localeCompare(b.date));

    // Current cheapest listing
    const currentTrips = await this.prisma.trip.findMany({
      where: {
        status: 'PLANNED',
        departureTime: { gte: new Date() },
        route: {
          originStation: { city: { equals: originCity, mode: 'insensitive' } },
          destinationStation: { city: { equals: destinationCity, mode: 'insensitive' } },
        },
      },
      select: { route: { select: { basePrice: true } } },
    });
    const currentPrices = currentTrips.map((t) => Number(t.route.basePrice));
    const currentMin = currentPrices.length > 0 ? Math.min(...currentPrices) : null;

    // Summary stats
    const allPrices = bookings.map((b) => Number(b.pricePaid));
    const avgPrice = allPrices.length > 0 ? allPrices.reduce((s, p) => s + p, 0) / allPrices.length : null;
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

    let verdict: 'GOOD' | 'AVERAGE' | 'EXPENSIVE' | 'UNKNOWN' = 'UNKNOWN';
    if (currentMin !== null && avgPrice !== null) {
      if (currentMin < avgPrice * 0.9) verdict = 'GOOD';
      else if (currentMin > avgPrice * 1.1) verdict = 'EXPENSIVE';
      else verdict = 'AVERAGE';
    }

    return {
      origin: originCity,
      destination: destinationCity,
      history,
      summary: {
        avgPrice: avgPrice !== null ? Math.round(avgPrice) : null,
        minPrice,
        maxPrice,
        currentMin,
        verdict,
        sampleSize: allPrices.length,
        days,
      },
    };
  }
}
