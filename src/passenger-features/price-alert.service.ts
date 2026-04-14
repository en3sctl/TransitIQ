import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PriceAlertService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { originCity: string; destinationCity: string; maxPrice: number; notifyEmail?: boolean; notifySms?: boolean }) {
    if (!dto.originCity?.trim() || !dto.destinationCity?.trim()) {
      throw new BadRequestException('Kalkış ve varış şehri gerekli');
    }
    if (dto.originCity.trim().toLowerCase() === dto.destinationCity.trim().toLowerCase()) {
      throw new BadRequestException('Kalkış ve varış aynı olamaz');
    }
    if (!dto.maxPrice || dto.maxPrice <= 0) {
      throw new BadRequestException('Geçerli bir fiyat giriniz');
    }

    return this.prisma.priceAlert.create({
      data: {
        userId,
        originCity: dto.originCity.trim().toLowerCase(),
        destinationCity: dto.destinationCity.trim().toLowerCase(),
        maxPrice: dto.maxPrice,
        notifyEmail: dto.notifyEmail !== false,
        notifySms: !!dto.notifySms,
      },
    });
  }

  async list(userId: string) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return alerts.map((a) => ({ ...a, maxPrice: Number(a.maxPrice) }));
  }

  async toggle(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id: alertId, userId },
    });
    if (!alert) throw new BadRequestException('Uyarı bulunamadı');
    return this.prisma.priceAlert.update({
      where: { id: alertId },
      data: { active: !alert.active },
    });
  }

  async remove(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id: alertId, userId },
    });
    if (!alert) throw new BadRequestException('Uyarı bulunamadı');
    await this.prisma.priceAlert.delete({ where: { id: alertId } });
    return { ok: true };
  }

  /**
   * Cron-friendly: returns alerts whose criteria are currently met.
   * Called by a scheduled task to notify users.
   */
  async findTriggered() {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { active: true },
      include: { user: { select: { id: true, name: true, email: true, phoneNumber: true } } },
    });

    const triggered: Array<{ alert: typeof alerts[number]; cheapestPrice: number }> = [];

    for (const alert of alerts) {
      const trips = await this.prisma.trip.findMany({
        where: {
          status: 'PLANNED',
          departureTime: { gte: new Date() },
          route: {
            originStation: { city: { equals: alert.originCity, mode: 'insensitive' } },
            destinationStation: { city: { equals: alert.destinationCity, mode: 'insensitive' } },
          },
        },
        include: { route: { select: { basePrice: true } } },
      });

      if (trips.length === 0) continue;

      const prices = trips.map((t) => Number(t.route.basePrice));
      const cheapest = Math.min(...prices);

      if (cheapest <= Number(alert.maxPrice)) {
        // Rate-limit notifications: once per 24h per alert
        const cooldown = 24 * 60 * 60 * 1000;
        if (alert.lastNotifiedAt && Date.now() - alert.lastNotifiedAt.getTime() < cooldown) continue;
        triggered.push({ alert, cheapestPrice: cheapest });
      }
    }

    return triggered;
  }

  async markNotified(alertId: string) {
    return this.prisma.priceAlert.update({
      where: { id: alertId },
      data: { lastNotifiedAt: new Date() },
    });
  }
}
