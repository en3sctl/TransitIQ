import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SearchTripsDto, CreateReservationDto, LockSeatsDto } from './dto/booking.dto';
import { BookingStatus, SeatStatus, TripStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgesService } from '../passenger-features/badges.service';
import { ReferralService } from '../passenger-features/referral.service';
import { AuditService } from '../common/audit/audit.service';
import { SeatsGateway } from './seats.gateway';
import { LocationService } from '../shared/location/location.service';
import { WaitingListService } from '../waiting-list/waiting-list.service';

const LOCK_DURATION_MINUTES = 10;

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    @Inject(forwardRef(() => BadgesService))
    private badges: BadgesService,
    @Inject(forwardRef(() => ReferralService))
    private referral: ReferralService,
    private audit: AuditService,
    @Inject(forwardRef(() => SeatsGateway))
    private seatsGateway: SeatsGateway,
    private location: LocationService,
    @Inject(forwardRef(() => WaitingListService))
    private waitingList: WaitingListService,
  ) {}

  // ─── Search Trips ───
  async searchTrips(searchDto: SearchTripsDto) {
    const { tenantId, startLocation, endLocation, date } = searchDto;

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const trips = await this.prisma.trip.findMany({
      where: {
        ...(tenantId && { tenantId }),
        status: TripStatus.PLANNED,
        // Only surface trips belonging to active (non-suspended) tenants
        tenant: { status: 'ACTIVE' },
        departureTime: {
          gte: searchDate,
          lt: nextDay,
        },
        route: {
          AND: [
            { originStation: { OR: [{ name: { contains: startLocation, mode: 'insensitive' } }, { city: { contains: startLocation, mode: 'insensitive' } }] } },
            { destinationStation: { OR: [{ name: { contains: endLocation, mode: 'insensitive' } }, { city: { contains: endLocation, mode: 'insensitive' } }] } },
          ],
        },
      },
      include: {
        tenant: {
          select: {
            id: true, name: true, publicName: true, slug: true,
            logoUrl: true, brandColor: true, verifiedAt: true,
          },
        },
        route: {
          include: {
            originStation: true,
            destinationStation: true,
            stops: { include: { station: true }, orderBy: { stopOrder: 'asc' } },
          },
        },
        vehicle: true,
        bookings: {
          where: { status: BookingStatus.CONFIRMED },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    // Bulk-fetch aggregated review stats per driver (only non-hidden)
    const driverIds = Array.from(new Set(trips.map((t) => t.driverId)));
    let driverStats: Record<string, { avg: number; count: number }> = {};
    if (driverIds.length) {
      const grouped = await this.prisma.review.groupBy({
        by: ['driverId'],
        where: { driverId: { in: driverIds }, hidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      });
      driverStats = grouped.reduce((acc, g) => {
        if (g.driverId) {
          acc[g.driverId] = {
            avg: g._avg.rating ? Math.round(Number(g._avg.rating) * 10) / 10 : 0,
            count: g._count._all,
          };
        }
        return acc;
      }, {} as Record<string, { avg: number; count: number }>);
    }

    return trips.map((trip) => {
      const bookedCount = trip.bookings.length;
      const availableSeats = trip.vehicle.capacity - bookedCount;
      const stats = driverStats[trip.driverId];
      // Prefer GPS-derived road distance when stations have coords,
      // fall back to the admin-entered totalDistanceKm.
      const gpsDistance = this.location.estimateRoadDistanceKm(
        trip.route.originStation.locationLat != null ? Number(trip.route.originStation.locationLat) : null,
        trip.route.originStation.locationLng != null ? Number(trip.route.originStation.locationLng) : null,
        trip.route.destinationStation.locationLat != null ? Number(trip.route.destinationStation.locationLat) : null,
        trip.route.destinationStation.locationLng != null ? Number(trip.route.destinationStation.locationLng) : null,
      );
      const distanceKm = gpsDistance ?? trip.route.totalDistanceKm;
      return {
        id: trip.id,
        departureTime: trip.departureTime,
        estimatedArrival: trip.estimatedArrival,
        status: trip.status,
        tenant: {
          id: trip.tenant.id,
          name: trip.tenant.publicName || trip.tenant.name,
          slug: trip.tenant.slug,
          logoUrl: trip.tenant.logoUrl,
          brandColor: trip.tenant.brandColor,
          verified: !!trip.tenant.verifiedAt,
        },
        origin: trip.route.originStation.city,
        destination: trip.route.destinationStation.city,
        originStation: trip.route.originStation.name,
        destinationStation: trip.route.destinationStation.name,
        price: Number(trip.route.basePrice),
        distanceKm,
        busType: `${trip.vehicle.layoutType} ${trip.vehicle.capacity <= 30 ? 'VIP' : 'Standart'}`,
        busModel: `${trip.vehicle.make} ${trip.vehicle.model}`,
        layoutType: trip.vehicle.layoutType,
        totalSeats: trip.vehicle.capacity,
        availableSeats,
        driverRating: stats?.avg ?? null,
        driverReviewCount: stats?.count ?? 0,
        stops: trip.route.stops.map((s) => ({
          name: s.station.name,
          city: s.station.city,
          offsetMinutes: s.arrivalTimeOffsetMinutes,
        })),
      };
    });
    // NOTE: full trips (availableSeats = 0) are intentionally kept in the
    // response so the UI can offer a "join waiting list" action for them.
  }

  // ─── Public: driver reviews (PII-masked) for the selected-trip panel ───
  async getPublicReviewsForDriver(driverId: string, take: number = 6) {
    const limit = Math.min(Math.max(take, 1), 20);
    const [items, agg] = await Promise.all([
      this.prisma.review.findMany({
        where: { driverId, hidden: false, OR: [{ comment: { not: null } }, { tags: { isEmpty: false } }] },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, rating: true, comment: true, tags: true, createdAt: true, userId: true,
        },
      }),
      this.prisma.review.aggregate({
        where: { driverId, hidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const userIds = Array.from(new Set(items.map((r) => r.userId)));
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name || 'Yolcu']));

    const reviews = items.map((r) => {
      const name = nameById.get(r.userId) || 'Yolcu';
      const author = name.split(' ').map((p) => (p.length > 1 ? p[0] + '.' : p)).join(' ');
      return {
        id: r.id, rating: r.rating, comment: r.comment, tags: r.tags, createdAt: r.createdAt, author,
      };
    });

    return {
      reviews,
      averageRating: agg._avg.rating ? Math.round(Number(agg._avg.rating) * 10) / 10 : 0,
      totalCount: agg._count._all,
    };
  }

  // ─── Price strip: per-day lowest price for ±N day ribbon ───
  async getPriceStrip(params: { from: string; to: string; centerDate: string; days: number }) {
    const { from, to, centerDate, days } = params;
    if (!from || !to || !centerDate) return [];

    const center = new Date(centerDate);
    center.setHours(0, 0, 0, 0);
    const half = Math.floor(days / 2);
    const start = new Date(center);
    start.setDate(start.getDate() - half);
    const end = new Date(center);
    end.setDate(end.getDate() + (days - half - 1) + 1); // inclusive end-of-day

    const trips = await this.prisma.trip.findMany({
      where: {
        status: TripStatus.PLANNED,
        departureTime: { gte: start, lt: end },
        route: {
          AND: [
            { originStation: { OR: [{ name: { contains: from, mode: 'insensitive' } }, { city: { contains: from, mode: 'insensitive' } }] } },
            { destinationStation: { OR: [{ name: { contains: to, mode: 'insensitive' } }, { city: { contains: to, mode: 'insensitive' } }] } },
          ],
        },
      },
      select: {
        departureTime: true,
        route: { select: { basePrice: true } },
        vehicle: { select: { capacity: true } },
        bookings: { where: { status: BookingStatus.CONFIRMED }, select: { id: true } },
      },
    });

    // Bucket by YYYY-MM-DD (local)
    const buckets = new Map<string, { tripCount: number; minPrice: number | null; availableSeats: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets.set(key, { tripCount: 0, minPrice: null, availableSeats: 0 });
    }

    for (const t of trips) {
      const d = new Date(t.departureTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const price = Number(t.route.basePrice);
      const available = t.vehicle.capacity - t.bookings.length;
      if (available <= 0) continue;
      bucket.tripCount += 1;
      bucket.availableSeats += available;
      bucket.minPrice = bucket.minPrice == null ? price : Math.min(bucket.minPrice, price);
    }

    return Array.from(buckets.entries()).map(([date, data]) => ({ date, ...data }));
  }

  // ─── Multi-Leg Journey Finder ───
  /**
   * When no direct trip exists, find indirect routes through hub cities.
   * Returns combined itineraries (A→Hub→B) with at least 30 min transfer time
   * and max 8 hour layover.
   */
  async searchMultiLeg(params: { from: string; to: string; date: string }) {
    const { from, to, date } = params;
    const MIN_TRANSFER_MINUTES = 30;
    const MAX_TRANSFER_HOURS = 8;
    const HUBS = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Konya', 'Antalya', 'Adana', 'Samsun', 'Kayseri', 'Eskişehir'];

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayAfter = new Date(searchDate);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    const candidates: Array<any> = [];

    for (const hub of HUBS) {
      const hubLower = hub.toLowerCase();
      if (hubLower === fromLower || hubLower === toLower) continue;

      const leg1Trips = await this.prisma.trip.findMany({
        where: {
          status: TripStatus.PLANNED,
          departureTime: { gte: new Date(), lt: nextDay },
          route: {
            originStation: { city: { equals: from, mode: 'insensitive' } },
            destinationStation: { city: { equals: hub, mode: 'insensitive' } },
          },
        },
        include: {
          route: { include: { originStation: true, destinationStation: true } },
          vehicle: true,
          bookings: { where: { status: BookingStatus.CONFIRMED } },
        },
        orderBy: { departureTime: 'asc' },
        take: 3,
      });

      if (leg1Trips.length === 0) continue;

      for (const leg1 of leg1Trips) {
        if ((leg1.vehicle.capacity - leg1.bookings.length) <= 0) continue;

        const leg1Arrival = leg1.estimatedArrival || new Date(leg1.departureTime.getTime() + 6 * 3600 * 1000);
        const minDeparture = new Date(leg1Arrival.getTime() + MIN_TRANSFER_MINUTES * 60000);
        const maxDeparture = new Date(leg1Arrival.getTime() + MAX_TRANSFER_HOURS * 3600 * 1000);

        const leg2Trips = await this.prisma.trip.findMany({
          where: {
            status: TripStatus.PLANNED,
            departureTime: { gte: minDeparture, lte: maxDeparture, lt: dayAfter },
            route: {
              originStation: { city: { equals: hub, mode: 'insensitive' } },
              destinationStation: { city: { equals: to, mode: 'insensitive' } },
            },
          },
          include: {
            route: { include: { originStation: true, destinationStation: true } },
            vehicle: true,
            bookings: { where: { status: BookingStatus.CONFIRMED } },
          },
          orderBy: { departureTime: 'asc' },
          take: 2,
        });

        for (const leg2 of leg2Trips) {
          if ((leg2.vehicle.capacity - leg2.bookings.length) <= 0) continue;

          const leg2Arrival = leg2.estimatedArrival || new Date(leg2.departureTime.getTime() + 6 * 3600 * 1000);
          const transferMinutes = Math.round((leg2.departureTime.getTime() - leg1Arrival.getTime()) / 60000);
          const totalDurationMinutes = Math.round((leg2Arrival.getTime() - leg1.departureTime.getTime()) / 60000);

          candidates.push({
            hub,
            leg1: this.formatTripForClient(leg1),
            leg2: this.formatTripForClient(leg2),
            totalPrice: Number(leg1.route.basePrice) + Number(leg2.route.basePrice),
            transferMinutes,
            totalDurationMinutes,
          });
        }
      }
    }

    return candidates
      .sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes)
      .slice(0, 8);
  }

  private formatTripForClient(trip: any) {
    const bookedCount = trip.bookings?.length || 0;
    return {
      id: trip.id,
      departureTime: trip.departureTime,
      estimatedArrival: trip.estimatedArrival,
      origin: trip.route.originStation.city,
      destination: trip.route.destinationStation.city,
      originStation: trip.route.originStation.name,
      destinationStation: trip.route.destinationStation.name,
      price: Number(trip.route.basePrice),
      availableSeats: trip.vehicle.capacity - bookedCount,
      totalSeats: trip.vehicle.capacity,
      layoutType: trip.vehicle.layoutType,
      busModel: `${trip.vehicle.make || ''} ${trip.vehicle.model || ''}`.trim(),
    };
  }

  // ─── Get Seat Map for a Trip ───
  async getTripSeatMap(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: {
          include: {
            seats: { orderBy: { seatNumber: 'asc' } },
          },
        },
        bookings: {
          where: { status: BookingStatus.CONFIRMED },
          select: { seatId: true },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const now = new Date();
    const bookedSeatIds = new Set(trip.bookings.map((b) => b.seatId));

    const seats = trip.vehicle.seats.map((seat) => {
      let status: string = 'AVAILABLE';

      if (bookedSeatIds.has(seat.id)) {
        status = 'SOLD';
      } else if (seat.status === SeatStatus.BLOCKED) {
        status = 'BLOCKED';
      } else if (seat.status === SeatStatus.LOCKED && seat.lockedUntil && seat.lockedUntil > now) {
        status = 'LOCKED';
      } else if (seat.status === SeatStatus.LOCKED && seat.lockedUntil && seat.lockedUntil <= now) {
        // Lock expired - treat as available (will be cleaned up)
        status = 'AVAILABLE';
      }

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        type: seat.type,
        status,
      };
    });

    return {
      tripId: trip.id,
      vehicleId: trip.vehicle.id,
      layoutType: trip.vehicle.layoutType,
      totalSeats: trip.vehicle.capacity,
      seats,
    };
  }

  // ─── Lock Seats (10-minute rule) ───
  async lockSeats(lockDto: LockSeatsDto & { sessionId: string }) {
    const { tripId, seatIds, sessionId } = lockDto;

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const now = new Date();
    const lockUntil = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000);

    // Check all seats are available
    const seats = await this.prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        vehicleId: trip.vehicleId,
      },
    });

    if (seats.length !== seatIds.length) {
      throw new BadRequestException('One or more seats not found for this vehicle');
    }

    const bookedSeatIds = new Set(
      (await this.prisma.booking.findMany({
        where: { tripId, seatId: { in: seatIds }, status: BookingStatus.CONFIRMED },
        select: { seatId: true },
      })).map((b) => b.seatId)
    );

    for (const seat of seats) {
      if (bookedSeatIds.has(seat.id)) {
        throw new ConflictException(`Seat ${seat.seatNumber} is already booked`);
      }
      if (seat.status === SeatStatus.LOCKED && seat.lockedUntil && seat.lockedUntil > now && seat.lockedBy !== sessionId) {
        throw new ConflictException(`Seat ${seat.seatNumber} is currently reserved by another user`);
      }
    }

    // Lock all seats atomically
    await this.prisma.$transaction(
      seatIds.map((seatId) =>
        this.prisma.seat.update({
          where: { id: seatId },
          data: {
            status: SeatStatus.LOCKED,
            lockedUntil: lockUntil,
            lockedBy: sessionId,
          },
        })
      )
    );

    // Broadcast to live viewers in the seat-selection room
    this.seatsGateway.broadcastSeatsChanged(tripId, {
      type: 'LOCKED',
      seatNumbers: seats.map((s) => s.seatNumber),
    });

    return {
      locked: true,
      lockedUntil: lockUntil,
      seatIds,
    };
  }

  // ─── Release Expired Locks ───
  async releaseExpiredLocks() {
    const now = new Date();
    await this.prisma.seat.updateMany({
      where: {
        status: SeatStatus.LOCKED,
        lockedUntil: { lt: now },
      },
      data: {
        status: SeatStatus.AVAILABLE,
        lockedUntil: null,
        lockedBy: null,
      },
    });
  }

  // ─── Create Multi-Seat Reservation ───
  async createReservation(createDto: CreateReservationDto & {
    tenantId?: string;
    userId?: string;
    paymentId?: string;
    paymentTransactionId?: string;
  }) {
    const { tripId, passengers, contactEmail, contactPhone, paymentId, paymentTransactionId } = createDto;

    // Find trip - if tenantId provided, scope to it; otherwise find by ID only
    const trip = await this.prisma.trip.findFirst({
      where: createDto.tenantId ? { id: tripId, tenantId: createDto.tenantId } : { id: tripId },
      include: { vehicle: true, route: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Use trip's tenantId and driverId as fallback userId
    const resolvedTenantId = createDto.tenantId || trip.tenantId;
    const resolvedUserId = createDto.userId || trip.driverId;

    const seatIds = passengers.map((p) => p.seatId);

    // Verify all seats exist and belong to this vehicle
    const seats = await this.prisma.seat.findMany({
      where: { id: { in: seatIds }, vehicleId: trip.vehicleId },
    });

    if (seats.length !== seatIds.length) {
      throw new BadRequestException('One or more invalid seat IDs');
    }

    // Check none are already booked
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        tripId,
        seatId: { in: seatIds },
        status: BookingStatus.CONFIRMED,
      },
    });

    if (existingBookings.length > 0) {
      throw new ConflictException('One or more seats are already booked');
    }

    // Create all bookings in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const bookings: Array<{ id: string; pnrCode: string }> = [];

      for (const passenger of passengers) {
        const pnrCode = this.generatePnrCode();

        const booking = await tx.booking.create({
          data: {
            tenantId: resolvedTenantId,
            tripId,
            userId: resolvedUserId,
            seatId: passenger.seatId,
            passengerTcNo: passenger.tcKimlik,
            passengerName: `${passenger.firstName} ${passenger.lastName}`,
            contactEmail,
            contactPhone,
            pnrCode,
            status: BookingStatus.CONFIRMED,
            pricePaid: trip.route.basePrice,
            paymentId: paymentId || null,
            paymentTransactionId: paymentTransactionId || null,
          },
        });

        // Mark seat as booked
        await tx.seat.update({
          where: { id: passenger.seatId },
          data: {
            status: SeatStatus.BOOKED,
            lockedUntil: null,
            lockedBy: null,
          },
        });

        bookings.push(booking);
      }

      return {
        bookings,
        totalPaid: Number(trip.route.basePrice) * passengers.length,
        pnrCodes: bookings.map((b) => b.pnrCode),
      };
    });

    // Fire-and-forget email notification (don't block reservation response)
    this.notifications.sendBookingConfirmation(result.pnrCodes).catch(() => {
      /* errors logged inside service */
    });

    // Fire-and-forget badge + referral evaluation (don't block the response)
    if (createDto.userId && result.bookings[0]) {
      this.badges.evaluateForUser(createDto.userId).catch(() => { /* non-fatal */ });
      this.referral.grantFirstBookingBonus(createDto.userId, result.bookings[0].id).catch(() => { /* non-fatal */ });
    }

    // Broadcast newly-booked seats to live viewers
    const bookedSeatNumbers = seats
      .filter((s) => seatIds.includes(s.id))
      .map((s) => s.seatNumber);
    this.seatsGateway.broadcastSeatsChanged(tripId, {
      type: 'BOOKED',
      seatNumbers: bookedSeatNumbers,
    });

    return result;
  }

  // ─── Passenger: Live trip tracking ───
  async getTripLiveLocation(pnrCode: string, email: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode: pnrCode.toUpperCase() },
      include: {
        trip: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true,
              },
            },
            vehicle: { select: { registrationPlate: true, model: true } },
            driver: { select: { name: true, phoneNumber: true } },
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Bilet bulunamadı');
    if (booking.contactEmail.toLowerCase() !== email.toLowerCase()) {
      throw new ForbiddenException('Bu bilete erişim yetkiniz yok');
    }

    const trip = booking.trip;
    const staleThreshold = 5 * 60 * 1000; // 5 min
    const isLive = !!(trip.currentLat && trip.currentLng && trip.lastLocationAt &&
      Date.now() - trip.lastLocationAt.getTime() < staleThreshold);

    return {
      pnr: booking.pnrCode,
      trip: {
        id: trip.id,
        status: trip.status,
        departureTime: trip.departureTime,
        estimatedArrival: trip.estimatedArrival,
        actualArrival: trip.actualArrival,
        origin: {
          city: trip.route.originStation.city,
          name: trip.route.originStation.name,
          lat: trip.route.originStation.locationLat ? Number(trip.route.originStation.locationLat) : null,
          lng: trip.route.originStation.locationLng ? Number(trip.route.originStation.locationLng) : null,
        },
        destination: {
          city: trip.route.destinationStation.city,
          name: trip.route.destinationStation.name,
          lat: trip.route.destinationStation.locationLat ? Number(trip.route.destinationStation.locationLat) : null,
          lng: trip.route.destinationStation.locationLng ? Number(trip.route.destinationStation.locationLng) : null,
        },
        vehicle: trip.vehicle,
        driverName: trip.driver?.name,
      },
      location: isLive
        ? {
            lat: trip.currentLat,
            lng: trip.currentLng,
            speed: trip.currentSpeed,
            at: trip.lastLocationAt,
            fresh: true,
          }
        : trip.currentLat && trip.currentLng
          ? {
              lat: trip.currentLat,
              lng: trip.currentLng,
              speed: trip.currentSpeed,
              at: trip.lastLocationAt,
              fresh: false,
            }
          : null,
    };
  }

  // ─── Admin: List bookings for a tenant with filters ───
  async listTenantBookings(tenantId: string, params: {
    status?: string;
    from?: string;
    to?: string;
    q?: string;
    skip?: number;
    take?: number;
  }) {
    const { status, from, to, q, skip = 0, take = 25 } = params;

    const where: any = { tenantId };
    if (status) where.status = status;

    if (from || to) {
      where.trip = where.trip || {};
      where.trip.departureTime = {};
      if (from) where.trip.departureTime.gte = new Date(from);
      if (to) where.trip.departureTime.lte = new Date(to);
    }

    if (q) {
      where.OR = [
        { pnrCode: { contains: q, mode: 'insensitive' } },
        { passengerName: { contains: q, mode: 'insensitive' } },
        { contactEmail: { contains: q, mode: 'insensitive' } },
        { contactPhone: { contains: q, mode: 'insensitive' } },
        { passengerTcNo: { contains: q } },
      ];
    }

    const [total, bookings, stats] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: Math.min(take, 100),
        orderBy: { bookingTime: 'desc' },
        include: {
          trip: {
            include: {
              route: { include: { originStation: true, destinationStation: true } },
              vehicle: true,
            },
          },
          seat: true,
        },
      }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      skip,
      take,
      stats: {
        confirmed: statsMap.CONFIRMED || 0,
        cancelled: statsMap.CANCELLED || 0,
        noShow: statsMap.NO_SHOW || 0,
      },
      bookings: bookings.map((b) => ({
        id: b.id,
        pnrCode: b.pnrCode,
        status: b.status,
        pricePaid: b.pricePaid,
        bookingTime: b.bookingTime,
        passengerName: b.passengerName,
        passengerTcNo: b.passengerTcNo,
        contactEmail: b.contactEmail,
        contactPhone: b.contactPhone,
        paymentId: b.paymentId,
        seat: { number: b.seat.seatNumber, type: b.seat.type },
        trip: {
          id: b.trip.id,
          departureTime: b.trip.departureTime,
          estimatedArrival: b.trip.estimatedArrival,
          status: b.trip.status,
          origin: { city: b.trip.route.originStation.city, name: b.trip.route.originStation.name },
          destination: { city: b.trip.route.destinationStation.city, name: b.trip.route.destinationStation.name },
          vehicle: { plate: b.trip.vehicle.registrationPlate, layoutType: b.trip.vehicle.layoutType },
        },
      })),
    };
  }

  // ─── Admin: Get single booking detail ───
  async getTenantBookingDetail(tenantId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: {
        trip: {
          include: {
            route: { include: { originStation: true, destinationStation: true } },
            vehicle: true,
            driver: { select: { name: true, email: true, phoneNumber: true } },
          },
        },
        seat: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    if (!booking) throw new NotFoundException('Bilet bulunamadı');
    return booking;
  }

  // ─── Admin Cancel Booking (with optional Iyzico refund) ───
  async cancelBooking(tenantId: string, bookingId: string, opts?: { refund?: boolean; actorId?: string }) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Bu bilet zaten iptal edilmiş');
    }

    // 1) Cancel + free seat
    const cancelled = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          refundStatus: opts?.refund && (booking as any).paymentTransactionId ? 'PENDING' : 'MANUAL',
        },
      });
      await tx.seat.update({
        where: { id: booking.seatId },
        data: { status: SeatStatus.AVAILABLE, lockedUntil: null, lockedBy: null },
      });
      return updated;
    });

    // Broadcast seat freed to live viewers
    const freedSeat = await this.prisma.seat.findUnique({
      where: { id: booking.seatId },
      select: { seatNumber: true },
    });
    if (freedSeat) {
      this.seatsGateway.broadcastSeatsChanged(booking.tripId, {
        type: 'FREED',
        seatNumbers: [freedSeat.seatNumber],
      });
    }

    this.audit.log({
      tenantId, userId: opts?.actorId,
      action: 'BOOKING_CANCEL',
      entityType: 'BOOKING', entityId: bookingId,
      oldValues: { status: booking.status, pnr: booking.pnrCode },
      newValues: { status: 'CANCELLED', refundRequested: !!opts?.refund },
    });

    // Seat just became available — notify top waiting-list members for this trip.
    // Fire-and-forget: must never block the cancel response.
    this.waitingList.handleSeatsFreed(booking.tripId).catch(() => {});

    return {
      booking: cancelled,
      paymentTransactionId: (booking as any).paymentTransactionId,
      pricePaid: booking.pricePaid.toString(),
    };
  }

  // ─── Get Ticket by PNR ───
  async getTicketByPnr(pnrCode: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode },
      include: {
        trip: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true,
              },
            },
          },
        },
        seat: true,
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Ticket not found');
    }

    // PII redaction: public PNR lookup should not leak TC or contact info.
    // Full details require email verification (see /auth/customer/lookup).
    const maskedName = booking.passengerName.split(' ')
      .map(p => p.length > 1 ? p[0] + '*'.repeat(Math.max(1, p.length - 2)) + p[p.length - 1] : p).join(' ');
    const maskedPhone = booking.contactPhone.length > 4
      ? booking.contactPhone.slice(0, 3) + '****' + booking.contactPhone.slice(-2)
      : '****';
    const emailParts = booking.contactEmail.split('@');
    const maskedEmail = emailParts[0].slice(0, 2) + '***@' + (emailParts[1] || '');

    return {
      pnrCode: booking.pnrCode,
      status: booking.status,
      pricePaid: booking.pricePaid,
      bookingTime: booking.bookingTime,
      passenger: {
        name: maskedName,
        tcNo: '*'.repeat(7) + booking.passengerTcNo.slice(-4),
        contactEmail: maskedEmail,
        contactPhone: maskedPhone,
      },
      seat: {
        number: booking.seat.seatNumber,
        type: booking.seat.type,
      },
      trip: {
        departureTime: booking.trip.departureTime,
        estimatedArrival: booking.trip.estimatedArrival,
        origin: {
          name: booking.trip.route.originStation.name,
          city: booking.trip.route.originStation.city,
        },
        destination: {
          name: booking.trip.route.destinationStation.name,
          city: booking.trip.route.destinationStation.city,
        },
      },
    };
  }

  /**
   * Generate a 6-char PNR code, telefon-dostu (I, O, 0, 1 excluded for clarity).
   * Format: TX-XXXXXX (uppercase, alphanumeric without ambiguous chars).
   * 32^6 = 1 billion combinations — collision-safe at typical scale.
   */
  private generatePnrCode(): string {
    const { randomBytes } = require('crypto');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(6);
    let code = 'TX-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(bytes[i] % chars.length);
    }
    return code;
  }
}
