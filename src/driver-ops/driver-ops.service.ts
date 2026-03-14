import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';

@Injectable()
export class DriverOpsService {
  constructor(private prisma: PrismaService) {}

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
    // Ensure trip belongs to driver and tenant
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
        driverId,
      },
    });

    if (!trip) {
      throw new ForbiddenException(`You are not authorized to log location for trip ${tripId}`);
    }

    // For now, just logging the coordinates. Future: Push to Redis/WebSockets.
    console.log(`[LIVE LOCATION] Tenant: ${tenantId}, Driver: ${driverId}, Trip: ${tripId}, Lat: ${locationDto.latitude}, Lng: ${locationDto.longitude}`);
    
    return { success: true, timestamp: new Date() };
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
