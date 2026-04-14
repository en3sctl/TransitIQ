import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export type BadgeId =
  | 'FIRST_TRIP'
  | 'FREQUENT_5'
  | 'EXPLORER_10'
  | 'MARATHON_25'
  | 'CITY_HUNTER_5'
  | 'WEEKEND_WARRIOR'
  | 'EARLY_BIRD'
  | 'NIGHT_OWL';

export const BADGE_DEFINITIONS: Record<BadgeId, { label: string; description: string; icon: string; tier: 'bronze' | 'silver' | 'gold' }> = {
  FIRST_TRIP: { label: 'İlk Yolculuk', description: 'İlk biletini aldın, hoş geldin!', icon: 'Ticket', tier: 'bronze' },
  FREQUENT_5: { label: 'Sık Yolcu', description: '5 sefer tamamladın', icon: 'Bus', tier: 'bronze' },
  EXPLORER_10: { label: 'Gezgin', description: '10 sefer tamamladın', icon: 'Compass', tier: 'silver' },
  MARATHON_25: { label: 'Maratoncu', description: '25 sefer tamamladın', icon: 'Trophy', tier: 'gold' },
  CITY_HUNTER_5: { label: 'Şehir Avcısı', description: '5 farklı şehre gittin', icon: 'MapPin', tier: 'silver' },
  WEEKEND_WARRIOR: { label: 'Hafta Sonu Gezgini', description: '3 hafta sonu yolculuğu', icon: 'Calendar', tier: 'bronze' },
  EARLY_BIRD: { label: 'Sabah Kuşu', description: '5 sabah seferi (06:00 öncesi)', icon: 'Sunrise', tier: 'bronze' },
  NIGHT_OWL: { label: 'Gece Yolcusu', description: '5 gece seferi (22:00 sonrası)', icon: 'Moon', tier: 'bronze' },
};

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Called after a booking is confirmed. Evaluates all badges and awards any newly earned ones.
   * Returns newly-earned badges for UI celebration.
   */
  async evaluateForUser(userId: string): Promise<BadgeId[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { userId, status: 'CONFIRMED' },
      include: {
        trip: {
          include: {
            route: {
              include: {
                originStation: { select: { city: true } },
                destinationStation: { select: { city: true } },
              },
            },
          },
        },
      },
    });

    const count = bookings.length;
    const cities = new Set<string>();
    let weekendCount = 0;
    let earlyCount = 0;
    let nightCount = 0;

    for (const b of bookings) {
      cities.add(b.trip.route.originStation.city.toLowerCase());
      cities.add(b.trip.route.destinationStation.city.toLowerCase());
      const d = new Date(b.trip.departureTime);
      const day = d.getDay();
      const hour = d.getHours();
      if (day === 0 || day === 6) weekendCount++;
      if (hour < 6) earlyCount++;
      if (hour >= 22) nightCount++;
    }

    const earned: BadgeId[] = [];
    if (count >= 1) earned.push('FIRST_TRIP');
    if (count >= 5) earned.push('FREQUENT_5');
    if (count >= 10) earned.push('EXPLORER_10');
    if (count >= 25) earned.push('MARATHON_25');
    if (cities.size >= 5) earned.push('CITY_HUNTER_5');
    if (weekendCount >= 3) earned.push('WEEKEND_WARRIOR');
    if (earlyCount >= 5) earned.push('EARLY_BIRD');
    if (nightCount >= 5) earned.push('NIGHT_OWL');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { badges: true },
    });
    const existing = new Set(user?.badges || []);
    const newlyEarned = earned.filter((b) => !existing.has(b));

    if (newlyEarned.length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          badges: [...existing, ...newlyEarned],
          totalTrips: count,
        },
      });
    } else if (user && count !== (await this.prisma.user.findUnique({ where: { id: userId }, select: { totalTrips: true } }))?.totalTrips) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { totalTrips: count },
      });
    }

    return newlyEarned;
  }

  async listForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { badges: true, totalTrips: true },
    });
    const earned = new Set(user?.badges || []);

    return {
      totalTrips: user?.totalTrips || 0,
      badges: (Object.keys(BADGE_DEFINITIONS) as BadgeId[]).map((id) => ({
        id,
        ...BADGE_DEFINITIONS[id],
        earned: earned.has(id),
      })),
    };
  }
}
