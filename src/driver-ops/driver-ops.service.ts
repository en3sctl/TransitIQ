import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';

@Injectable()
export class DriverOpsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getTodayTrips(tenantId: string, driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.trip.findMany({
      where: {
        tenantId,
        driverId,
        departureTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        route: true,
        vehicle: true,
      },
    });
  }

  async updateTripStatus(tenantId: string, driverId: string, tripId: string, updateTripStatusDto: UpdateTripStatusDto) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
        driverId,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found or not assigned to you`);
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: { status: updateTripStatusDto.status },
    });
  }

  async logLocation(tenantId: string, driverId: string, tripId: string, locationDto: LocationDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
    });

    if (!trip) {
      throw new ForbiddenException(`You are not authorized to log location for trip ${tripId}`);
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        currentLat: locationDto.latitude,
        currentLng: locationDto.longitude,
        currentSpeed: (locationDto as any).speed ?? null,
        lastLocationAt: new Date(),
      },
    });

    return {
      success: true,
      timestamp: updated.lastLocationAt,
      lat: updated.currentLat,
      lng: updated.currentLng,
    };
  }

  /**
   * Full passenger manifest for a trip. Driver can see all bookings + boarding status.
   */
  async getManifest(tenantId: string, driverId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
      include: {
        route: {
          include: {
            originStation: { select: { name: true, city: true } },
            destinationStation: { select: { name: true, city: true } },
          },
        },
        vehicle: { select: { registrationPlate: true, model: true, capacity: true, layoutType: true } },
      },
    });
    if (!trip) throw new ForbiddenException('Bu seferi görmeye yetkin yok');

    const bookings = await this.prisma.booking.findMany({
      where: { tripId, status: 'CONFIRMED' },
      include: {
        seat: { select: { seatNumber: true, type: true } },
      },
      orderBy: { seat: { seatNumber: 'asc' } },
    });

    const stats = {
      total: bookings.length,
      boarded: bookings.filter((b) => b.boardingStatus === 'BOARDED').length,
      pending: bookings.filter((b) => b.boardingStatus === 'PENDING').length,
      noShow: bookings.filter((b) => b.boardingStatus === 'NO_SHOW').length,
    };

    return {
      trip: {
        id: trip.id,
        status: trip.status,
        departureTime: trip.departureTime,
        estimatedArrival: trip.estimatedArrival,
        origin: trip.route.originStation,
        destination: trip.route.destinationStation,
        vehicle: trip.vehicle,
      },
      stats,
      passengers: bookings.map((b) => ({
        bookingId: b.id,
        pnrCode: b.pnrCode,
        passengerName: b.passengerName,
        passengerTcNo: b.passengerTcNo,
        contactPhone: b.contactPhone,
        seatNumber: b.seat.seatNumber,
        seatType: b.seat.type,
        pricePaid: Number(b.pricePaid),
        boardingStatus: b.boardingStatus,
        boardedAt: b.boardedAt,
      })),
    };
  }

  /**
   * Check-in a passenger by PNR or booking ID.
   * Verifies the driver owns the trip and the PNR belongs to it.
   */
  async checkInPassenger(tenantId: string, driverId: string, pnr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode: pnr.toUpperCase() },
      include: { trip: true },
    });

    if (!booking) throw new NotFoundException('PNR bulunamadı');
    if (booking.trip.tenantId !== tenantId || booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Bu PNR sana ait bir sefere değil');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new ForbiddenException('Bu bilet iptal edilmiş veya geçersiz');
    }

    if (booking.boardingStatus === 'BOARDED') {
      return { alreadyBoarded: true, at: booking.boardedAt, booking };
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        boardingStatus: 'BOARDED',
        boardedAt: new Date(),
        boardedBy: driverId,
      },
      include: { seat: { select: { seatNumber: true } } },
    });

    this.audit.log({
      tenantId, userId: driverId,
      action: 'PASSENGER_CHECK_IN',
      entityType: 'BOOKING', entityId: booking.id,
      newValues: { pnr: updated.pnrCode, seatNumber: updated.seat.seatNumber },
    });

    return {
      alreadyBoarded: false,
      pnr: updated.pnrCode,
      passengerName: updated.passengerName,
      seatNumber: updated.seat.seatNumber,
      boardedAt: updated.boardedAt,
    };
  }

  /**
   * Mark a passenger as NO_SHOW (didn't board).
   */
  async markNoShow(tenantId: string, driverId: string, pnr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode: pnr.toUpperCase() },
      include: { trip: true },
    });
    if (!booking) throw new NotFoundException('PNR bulunamadı');
    if (booking.trip.tenantId !== tenantId || booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Bu PNR sana ait bir sefere değil');
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { boardingStatus: 'NO_SHOW' },
    });

    this.audit.log({
      tenantId, userId: driverId,
      action: 'PASSENGER_NO_SHOW',
      entityType: 'BOOKING', entityId: booking.id,
      newValues: { pnr: updated.pnrCode },
    });

    return updated;
  }

  /**
   * Undo a boarding action (revert to PENDING).
   */
  async resetBoardingStatus(tenantId: string, driverId: string, pnr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode: pnr.toUpperCase() },
      include: { trip: true },
    });
    if (!booking) throw new NotFoundException('PNR bulunamadı');
    if (booking.trip.tenantId !== tenantId || booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Bu PNR sana ait bir sefere değil');
    }

    return this.prisma.booking.update({
      where: { id: booking.id },
      data: { boardingStatus: 'PENDING', boardedAt: null, boardedBy: null },
    });
  }

  async createExpense(tenantId: string, driverId: string, tripId: string, createExpenseDto: CreateExpenseDto) {
    // Ensure trip belongs to driver and tenant
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
        driverId,
      },
    });

    if (!trip) {
      throw new ForbiddenException(`You are not authorized to submit expenses for trip ${tripId}`);
    }

    // Expense model was removed in the enterprise overhaul.
    // This feature is currently disabled or will be moved to a different billing module.
    console.log(`[EXPENSE BLOCKED] Tenant: ${tenantId}, Trip: ${tripId}, Model no longer exists.`);
    return { success: false, message: 'Expense tracking is temporarily disabled.' };
  }
}
