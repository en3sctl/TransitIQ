import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SearchTripsDto } from './dto/booking.dto';
import { BookingStatus, TripStatus } from '@prisma/client';

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
        status: TripStatus.PLANNED,
        departureTime: {
          gte: searchDate,
          lt: nextDay,
        },
        route: {
          OR: [
            { originStation: { name: { contains: startLocation, mode: 'insensitive' } } },
            { destinationStation: { name: { contains: endLocation, mode: 'insensitive' } } },
            { stops: { some: { station: { name: { contains: startLocation, mode: 'insensitive' } } } } }
          ]
        },
      },
      include: {
        route: {
          include: {
            originStation: true,
            destinationStation: true,
          }
        },
        vehicle: true,
        bookings: {
          where: {
            status: { in: [BookingStatus.CONFIRMED] },
          },
        },
      },
    });

    // Calculate available seats and filter
    return trips.map(trip => {
      const takenSeats = trip.bookings.length;
      const availableSeats = trip.vehicle.capacity - takenSeats;
      return {
        ...trip,
        availableSeats,
      };
    }).filter(trip => trip.availableSeats > 0);
  }

  async createReservation(createDto: any & { tenantId: string; userId: string }) {
    const { tenantId, tripId, userId, seatId } = createDto;

    // 1. Verify trip exists and has capacity
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
      include: { vehicle: true, route: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // 2. Check if seat is already taken
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        tripId,
        seatId,
        status: { in: [BookingStatus.CONFIRMED] },
      },
    });

    if (existingBooking) {
      throw new ConflictException(`Seat is already occupied`);
    }

    // 3. Generate PNR Code
    const pnrCode = this.generatePnrCode();

    // 4. Create Booking
    return this.prisma.booking.create({
      data: {
        tenantId,
        tripId,
        userId,
        seatId,
        pnrCode,
        status: BookingStatus.CONFIRMED,
        pricePaid: trip.route.basePrice,
      },
    });
  }

  /**
   * Cancel a booking.
   */
  async cancelBooking(tenantId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });
  }

  private generatePnrCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
