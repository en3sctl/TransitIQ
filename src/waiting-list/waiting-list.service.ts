import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface JoinWaitingListDto {
  tripId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  passengerCount?: number;
}

@Injectable()
export class WaitingListService {
  private readonly logger = new Logger(WaitingListService.name);
  /** When a seat frees up we notify up to this many queued passengers. */
  private readonly NOTIFY_BATCH_LIMIT = 5;
  /** Minimum interval between re-notifications of the same entry. */
  private readonly RENOTIFY_MIN_HOURS = 24;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async join(dto: JoinWaitingListDto, userId?: string) {
    if (!dto.tripId) throw new BadRequestException('Sefer gerekli');
    if (!dto.contactEmail || !dto.contactName) throw new BadRequestException('İsim ve e-posta gerekli');

    const passengers = Math.min(Math.max(dto.passengerCount || 1, 1), 5);

    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      include: {
        vehicle: { select: { capacity: true } },
        bookings: { where: { status: 'CONFIRMED' }, select: { id: true } },
        route: {
          include: {
            originStation: { select: { city: true } },
            destinationStation: { select: { city: true } },
          },
        },
      },
    });
    if (!trip) throw new NotFoundException('Sefer bulunamadı');
    if (trip.status !== 'PLANNED') throw new BadRequestException('Sadece planlı seferler için bekleme listesine katılabilirsin');
    if (trip.departureTime.getTime() < Date.now()) throw new BadRequestException('Geçmiş sefer');

    const booked = trip.bookings.length;
    const available = trip.vehicle.capacity - booked;
    if (available >= passengers) {
      throw new BadRequestException('Bu seferde hâlâ boş koltuk var, direkt rezervasyon yapabilirsin');
    }

    // Duplicate check by email+trip (active entry)
    const existing = await this.prisma.waitingListEntry.findFirst({
      where: {
        tripId: dto.tripId,
        contactEmail: dto.contactEmail.toLowerCase(),
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
    });
    if (existing) {
      throw new BadRequestException('Zaten bu sefer için bekleme listesindesin');
    }

    return this.prisma.waitingListEntry.create({
      data: {
        tenantId: trip.tenantId,
        tripId: dto.tripId,
        userId: userId || null,
        contactName: dto.contactName.trim(),
        contactEmail: dto.contactEmail.toLowerCase().trim(),
        contactPhone: dto.contactPhone?.trim() || null,
        passengerCount: passengers,
      },
      select: {
        id: true, status: true, passengerCount: true, createdAt: true,
      },
    });
  }

  /** Passenger: my entries (authed) */
  async myEntries(userId: string) {
    const entries = await this.prisma.waitingListEntry.findMany({
      where: { userId, status: { in: ['WAITING', 'NOTIFIED'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    // Batch-load trips to avoid N+1
    const tripIds = Array.from(new Set(entries.map((e) => e.tripId)));
    const trips = tripIds.length
      ? await this.prisma.trip.findMany({
          where: { id: { in: tripIds } },
          select: {
            id: true, departureTime: true, status: true,
            route: {
              include: {
                originStation: { select: { city: true, name: true } },
                destinationStation: { select: { city: true, name: true } },
              },
            },
            vehicle: { select: { capacity: true } },
            bookings: { where: { status: 'CONFIRMED' }, select: { id: true } },
          },
        })
      : [];
    const tripById = new Map(trips.map((t) => [t.id, t]));

    return entries.map((e) => {
      const t = tripById.get(e.tripId);
      return {
        id: e.id,
        status: e.status,
        passengerCount: e.passengerCount,
        createdAt: e.createdAt,
        notifiedAt: e.notifiedAt,
        trip: t
          ? {
              id: t.id,
              departureTime: t.departureTime,
              status: t.status,
              origin: t.route.originStation.city,
              originStation: t.route.originStation.name,
              destination: t.route.destinationStation.city,
              destinationStation: t.route.destinationStation.name,
              availableSeats: Math.max(0, t.vehicle.capacity - t.bookings.length),
            }
          : null,
      };
    });
  }

  /** Passenger: cancel my entry */
  async cancelEntry(userId: string, entryId: string) {
    const entry = await this.prisma.waitingListEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException();
    if (entry.userId !== userId) throw new ForbiddenException('Bu kayıt senin değil');
    return this.prisma.waitingListEntry.update({
      where: { id: entryId },
      data: { status: 'CANCELLED' },
    });
  }

  /** Admin: list all entries for tenant */
  async adminList(tenantId: string, opts: { status?: string; tripId?: string; take?: number; skip?: number } = {}) {
    const { status, tripId, take = 50, skip = 0 } = opts;
    const where: any = { tenantId };
    if (status) where.status = status;
    if (tripId) where.tripId = tripId;

    const [items, total, stats] = await Promise.all([
      this.prisma.waitingListEntry.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        take,
        skip,
      }),
      this.prisma.waitingListEntry.count({ where }),
      this.prisma.waitingListEntry.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    const tripIds = Array.from(new Set(items.map((e) => e.tripId)));
    const trips = tripIds.length
      ? await this.prisma.trip.findMany({
          where: { id: { in: tripIds } },
          select: {
            id: true, departureTime: true,
            route: {
              include: {
                originStation: { select: { city: true } },
                destinationStation: { select: { city: true } },
              },
            },
          },
        })
      : [];
    const tripById = new Map(trips.map((t) => [t.id, t]));

    const statsMap = stats.reduce((acc, s) => { acc[s.status] = s._count._all; return acc; }, {} as Record<string, number>);

    return {
      entries: items.map((e) => {
        const t = tripById.get(e.tripId);
        return {
          ...e,
          trip: t
            ? {
                id: t.id,
                departureTime: t.departureTime,
                origin: t.route.originStation.city,
                destination: t.route.destinationStation.city,
              }
            : null,
        };
      }),
      total,
      stats: {
        waiting: statsMap.WAITING || 0,
        notified: statsMap.NOTIFIED || 0,
        converted: statsMap.CONVERTED || 0,
        expired: statsMap.EXPIRED || 0,
        cancelled: statsMap.CANCELLED || 0,
      },
    };
  }

  /**
   * Called when a booking is cancelled (or seats otherwise free up).
   * Picks the oldest WAITING entries whose passengerCount fits the newly
   * available seat count and emails them — capped at NOTIFY_BATCH_LIMIT.
   */
  async handleSeatsFreed(tripId: string) {
    try {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          vehicle: { select: { capacity: true } },
          bookings: { where: { status: 'CONFIRMED' }, select: { id: true } },
          route: {
            include: {
              originStation: { select: { city: true, name: true } },
              destinationStation: { select: { city: true, name: true } },
            },
          },
        },
      });
      if (!trip || trip.status !== 'PLANNED') return;
      if (trip.departureTime.getTime() < Date.now()) return;

      const available = trip.vehicle.capacity - trip.bookings.length;
      if (available <= 0) return;

      const now = new Date();
      const renotifyCutoff = new Date(now.getTime() - this.RENOTIFY_MIN_HOURS * 3600 * 1000);

      const candidates = await this.prisma.waitingListEntry.findMany({
        where: {
          tripId,
          status: { in: ['WAITING', 'NOTIFIED'] },
          passengerCount: { lte: available },
          OR: [{ notifiedAt: null }, { notifiedAt: { lt: renotifyCutoff } }],
        },
        orderBy: { createdAt: 'asc' },
        take: this.NOTIFY_BATCH_LIMIT,
      });

      if (candidates.length === 0) return;

      const tripSummary = {
        origin: trip.route.originStation.city,
        destination: trip.route.destinationStation.city,
        departureTime: trip.departureTime,
      };

      for (const entry of candidates) {
        try {
          await this.notifications.sendSeatAvailable({
            to: entry.contactEmail,
            name: entry.contactName,
            tripId: trip.id,
            origin: tripSummary.origin,
            destination: tripSummary.destination,
            departureTime: tripSummary.departureTime,
            availableSeats: available,
          });
          await this.prisma.waitingListEntry.update({
            where: { id: entry.id },
            data: {
              status: 'NOTIFIED',
              notifiedAt: now,
              notifyCount: { increment: 1 },
            },
          });
        } catch (err) {
          this.logger.error(`Waiting-list notify failed for entry ${entry.id}: ${err instanceof Error ? err.message : err}`);
        }
      }
    } catch (err) {
      this.logger.error(`handleSeatsFreed threw: ${err instanceof Error ? err.message : err}`);
    }
  }
}
