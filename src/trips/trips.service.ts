import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTripDto } from './dto/trip.dto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.trip.findMany({
      where: { tenantId },
      include: {
        route: {
          include: {
            originStation: true,
            destinationStation: true,
          },
        },
        vehicle: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });
  }

  async create(tenantId: string, dto: CreateTripDto) {
    const departureTime = new Date(dto.departureTime);

    return this.prisma.trip.create({
      data: {
        tenantId,
        routeId: dto.routeId,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        departureTime,
        estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : null,
        notes: dto.notes || null,
        status: 'PLANNED',
      },
      include: {
        route: {
          include: {
            originStation: true,
            destinationStation: true,
          },
        },
        vehicle: true,
      },
    });
  }

  /**
   * Public: upcoming trips sorted by price (ascending) — for landing "ucuz seferler".
   * Limited to future PLANNED trips across all tenants.
   */
  async findCheapPublic(limit = 6) {
    const trips = await this.prisma.trip.findMany({
      where: {
        status: 'PLANNED',
        departureTime: { gte: new Date() },
      },
      include: {
        route: {
          include: {
            originStation: true,
            destinationStation: true,
          },
        },
        vehicle: { select: { registrationPlate: true, model: true } },
        tenant: { select: { name: true, slug: true } },
        _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
      },
      orderBy: { departureTime: 'asc' },
      take: 200,
    });

    const enriched = trips.map((t) => ({
      id: t.id,
      origin: { city: t.route.originStation.city, name: t.route.originStation.name },
      destination: { city: t.route.destinationStation.city, name: t.route.destinationStation.name },
      price: Number(t.route.basePrice),
      departureTime: t.departureTime,
      estimatedArrival: t.estimatedArrival,
      distanceKm: t.route.totalDistanceKm,
      tenant: t.tenant,
      vehicle: t.vehicle,
      bookingCount: t._count?.bookings || 0,
    }));

    return enriched.sort((a, b) => a.price - b.price).slice(0, limit);
  }

  async findOne(tenantId: string, id: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, tenantId },
      include: {
        route: {
          include: {
            originStation: true,
            destinationStation: true,
          },
        },
        vehicle: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    return trip;
  }
}
