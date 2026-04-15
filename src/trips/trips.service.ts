import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateTripDto } from './dto/trip.dto';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Verify that a route, vehicle, and driver all belong to the given tenant.
   * Prevents cross-tenant resource linking via forged IDs.
   */
  private async assertTenantOwnership(tenantId: string, routeId: string, vehicleId: string, driverId: string) {
    const [route, vehicle, driver] = await Promise.all([
      this.prisma.route.findFirst({ where: { id: routeId, tenantId } }),
      this.prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId, deletedAt: null } }),
      this.prisma.user.findFirst({ where: { id: driverId, tenantId, role: 'DRIVER', deletedAt: null } }),
    ]);
    if (!route) throw new BadRequestException('Rota bu şirkete ait değil');
    if (!vehicle) throw new BadRequestException('Araç bu şirkete ait değil');
    if (!driver) throw new BadRequestException('Şoför bu şirkete ait değil veya silinmiş');
  }

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

    await this.assertTenantOwnership(tenantId, dto.routeId, dto.vehicleId, dto.driverId);

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

  /**
   * Reassign driver or vehicle to an existing trip.
   * Used when original driver is sick, vehicle broke down, etc.
   */
  async update(tenantId: string, actorId: string, tripId: string, dto: { driverId?: string; vehicleId?: string }) {
    const trip = await this.prisma.trip.findFirst({ where: { id: tripId, tenantId } });
    if (!trip) throw new NotFoundException('Sefer bulunamadı');
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new ForbiddenException('Tamamlanmış veya iptal edilmiş sefer değiştirilemez');
    }

    const data: any = {};
    const oldValues: any = {};
    const newValues: any = {};

    if (dto.driverId && dto.driverId !== trip.driverId) {
      const driver = await this.prisma.user.findFirst({
        where: { id: dto.driverId, tenantId, role: 'DRIVER', deletedAt: null },
      });
      if (!driver) throw new BadRequestException('Şoför bu şirkete ait değil veya silinmiş');
      data.driverId = dto.driverId;
      oldValues.driverId = trip.driverId;
      newValues.driverId = dto.driverId;
    }
    if (dto.vehicleId && dto.vehicleId !== trip.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id: dto.vehicleId, tenantId, deletedAt: null },
      });
      if (!vehicle) throw new BadRequestException('Araç bu şirkete ait değil');
      data.vehicleId = dto.vehicleId;
      oldValues.vehicleId = trip.vehicleId;
      newValues.vehicleId = dto.vehicleId;
    }

    if (Object.keys(data).length === 0) return trip;

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data,
      include: {
        route: { include: { originStation: true, destinationStation: true } },
        vehicle: true,
        driver: { select: { id: true, name: true, email: true } },
      },
    });

    if (data.driverId) {
      this.audit.log({
        tenantId, userId: actorId,
        action: 'TRIP_REASSIGN_DRIVER',
        entityType: 'TRIP', entityId: tripId,
        oldValues, newValues,
      });
    }
    if (data.vehicleId) {
      this.audit.log({
        tenantId, userId: actorId,
        action: 'TRIP_REASSIGN_VEHICLE',
        entityType: 'TRIP', entityId: tripId,
        oldValues, newValues,
      });
    }

    return updated;
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
