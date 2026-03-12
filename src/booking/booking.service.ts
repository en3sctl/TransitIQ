import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SearchTripsDto, CreateReservationDto } from './dto/booking.dto';
import { ReservationStatus, PaymentStatus, TripStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search for trips matching the criteria and filter by seat availability.
   */
  async searchTrips(searchDto: SearchTripsDto) {
    const { tenantId, startLocation, endLocation, date } = searchDto;
    
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const trips = await this.prisma.trip.findMany({
      where: {
        tenantId,
        status: TripStatus.PENDING,
        startTime: {
          gte: searchDate,
          lt: nextDay,
        },
        route: {
          startLocation: { contains: startLocation, mode: 'insensitive' },
          endLocation: { contains: endLocation, mode: 'insensitive' },
        },
        deletedAt: null,
      },
      include: {
        route: true,
        vehicle: true,
        reservations: {
          where: {
            status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
          },
        },
      },
    });

    // Calculate available seats and filter
    return trips.map(trip => {
      const takenSeats = trip.reservations.length;
      const availableSeats = trip.vehicle.capacity - takenSeats;
      return {
        ...trip,
        availableSeats,
      };
    }).filter(trip => trip.availableSeats > 0);
  }

  /**
   * Create a reservation for a passenger.
   */
  async createReservation(createDto: CreateReservationDto & { tenantId: string; passengerId: string }) {
    const { tenantId, tripId, passengerId, seatNumber } = createDto;

    // 1. Verify trip exists and has capacity
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, deletedAt: null },
      include: { vehicle: true, route: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // 2. Check if seat is already taken
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        tripId,
        seatNumber,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      },
    });

    if (existingReservation) {
      throw new ConflictException(`Seat number ${seatNumber} is already occupied`);
    }

    // 3. Generate PNR Code
    const pnrCode = this.generatePnrCode();

    // 4. Create Reservation
    return this.prisma.reservation.create({
      data: {
        tenantId,
        tripId,
        passengerId,
        seatNumber,
        pnrCode,
        status: ReservationStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: trip.route.basePrice, // Simplification: using route base price
      },
    });
  }

  /**
   * Simulate a payment and confirm reservation.
   */
  async payReservation(tenantId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Reservation is already paid');
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: ReservationStatus.CONFIRMED,
      },
    });
  }

  private generatePnrCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
