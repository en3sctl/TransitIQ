import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SearchTripsDto, CreateReservationDto, LockSeatsDto } from './dto/booking.dto';
import { BookingStatus, SeatStatus, TripStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgesService } from '../passenger-features/badges.service';
import { ReferralService } from '../passenger-features/referral.service';

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

    return trips.map((trip) => {
      const bookedCount = trip.bookings.length;
      const availableSeats = trip.vehicle.capacity - bookedCount;
      return {
        id: trip.id,
        departureTime: trip.departureTime,
        estimatedArrival: trip.estimatedArrival,
        status: trip.status,
        origin: trip.route.originStation.city,
        destination: trip.route.destinationStation.city,
        originStation: trip.route.originStation.name,
        destinationStation: trip.route.destinationStation.name,
        price: Number(trip.route.basePrice),
        distanceKm: trip.route.totalDistanceKm,
        busType: `${trip.vehicle.layoutType} ${trip.vehicle.capacity <= 30 ? 'VIP' : 'Standart'}`,
        busModel: `${trip.vehicle.make} ${trip.vehicle.model}`,
        layoutType: trip.vehicle.layoutType,
        totalSeats: trip.vehicle.capacity,
        availableSeats,
        stops: trip.route.stops.map((s) => ({
          name: s.station.name,
          city: s.station.city,
          offsetMinutes: s.arrivalTimeOffsetMinutes,
        })),
      };
    }).filter((trip) => trip.availableSeats > 0);
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

    return result;
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
  async cancelBooking(tenantId: string, bookingId: string, opts?: { refund?: boolean }) {
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

    return {
      pnrCode: booking.pnrCode,
      status: booking.status,
      pricePaid: booking.pricePaid,
      bookingTime: booking.bookingTime,
      passenger: {
        name: booking.passengerName,
        tcNo: booking.passengerTcNo,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
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

  private generatePnrCode(): string {
    const { randomBytes } = require('crypto');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(8);
    let code = 'TX-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(bytes[i] % chars.length);
    }
    return code;
  }
}
