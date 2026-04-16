import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { PricingService } from '../shared/pricing/pricing.service';
import { LocationService } from '../shared/location/location.service';

@Injectable()
export class RoutesService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private locationService: LocationService,
    private audit: AuditService,
  ) {}

  async create(tenantId: string, createRouteDto: CreateRouteDto, actorId?: string) {
    const { originStationId, destinationStationId, basePrice, taxRate = 0.18, title, totalDistanceKm: providedDistance } = createRouteDto;

    // Fetch stations to get names for distance mock calculation
    const origin = await this.prisma.station.findUnique({ where: { id: originStationId } });
    const destination = await this.prisma.station.findUnique({ where: { id: destinationStationId } });

    // Use LocationService mock if distance not or provided explicitly
    const totalDistanceKm = providedDistance || this.locationService.calculateDistanceKm(
      origin?.name || 'Unknown',
      destination?.name || 'Unknown',
    );

    // Final price calculation (logic in PricingService)
    const finalPrice = this.pricingService.calculateFinalPrice(basePrice, taxRate);
    console.log(`Calculated Final Price: ${finalPrice}`);

    const created = await this.prisma.route.create({
      data: {
        title,
        originStationId,
        destinationStationId,
        basePrice,
        taxRate,
        totalDistanceKm,
        tenantId,
      },
      include: {
        originStation: true,
        destinationStation: true,
      },
    });

    this.audit.log({
      tenantId, userId: actorId,
      action: 'CREATE',
      entityType: 'ROUTE', entityId: created.id,
      newValues: {
        title: created.title,
        origin: created.originStation.city,
        destination: created.destinationStation.city,
        basePrice: created.basePrice,
      },
    });

    return created;
  }

  async findAll(tenantId: string) {
    return this.prisma.route.findMany({
      where: {
        tenantId,
      },
      include: {
        originStation: true,
        destinationStation: true,
      },
    });
  }

  /**
   * Public route listing for /rotalar page.
   * Returns all routes across tenants with origin/destination + minimum upcoming trip price.
   */
  async findAllPublic(q?: string) {
    const where: any = {};
    if (q) {
      where.OR = [
        { originStation: { city: { contains: q, mode: 'insensitive' } } },
        { destinationStation: { city: { contains: q, mode: 'insensitive' } } },
        { originStation: { name: { contains: q, mode: 'insensitive' } } },
        { destinationStation: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const routes = await this.prisma.route.findMany({
      where,
      include: {
        originStation: true,
        destinationStation: true,
        trips: {
          where: {
            status: 'PLANNED',
            departureTime: { gte: new Date() },
          },
          orderBy: { departureTime: 'asc' },
          take: 1,
        },
      },
    });

    // Deduplicate by origin→destination city pair, pick cheapest
    const map = new Map<string, any>();
    for (const r of routes) {
      const key = `${r.originStation.city}→${r.destinationStation.city}`;
      const price = Number(r.basePrice);
      const existing = map.get(key);
      if (!existing || price < existing.price) {
        map.set(key, {
          id: r.id,
          origin: { city: r.originStation.city, name: r.originStation.name },
          destination: { city: r.destinationStation.city, name: r.destinationStation.name },
          price,
          distanceKm: r.totalDistanceKm,
          nextDeparture: r.trips[0]?.departureTime || null,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.price - b.price);
  }

  /**
   * Top popular routes by confirmed booking count.
   * Returns origin→destination city pairs with stats.
   */
  async findPopularPublic(limit = 8) {
    const routes = await this.prisma.route.findMany({
      include: {
        originStation: true,
        destinationStation: true,
        trips: {
          where: {
            status: 'PLANNED',
            departureTime: { gte: new Date() },
          },
          orderBy: { departureTime: 'asc' },
          include: {
            _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
          },
        },
      },
    });

    const map = new Map<string, any>();
    for (const r of routes) {
      const key = `${r.originStation.city}→${r.destinationStation.city}`;
      const price = Number(r.basePrice);
      const bookingCount = r.trips.reduce((s, t) => s + (t._count?.bookings || 0), 0);
      const nextTrip = r.trips[0] || null;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: r.id,
          origin: { city: r.originStation.city, name: r.originStation.name },
          destination: { city: r.destinationStation.city, name: r.destinationStation.name },
          price,
          distanceKm: r.totalDistanceKm,
          bookingCount,
          tripCount: r.trips.length,
          nextDeparture: nextTrip?.departureTime || null,
        });
      } else {
        existing.bookingCount += bookingCount;
        existing.tripCount += r.trips.length;
        if (price < existing.price) existing.price = price;
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.bookingCount - a.bookingCount || a.price - b.price)
      .slice(0, limit);
  }

  /**
   * Public platform-wide stats for landing ticker.
   * Non-sensitive aggregates suitable for marketing display.
   */
  async findPublicStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [routes, trips, upcomingTrips, confirmedBookings, tenants, cities, newRoutes, newStations] = await Promise.all([
      this.prisma.route.count(),
      this.prisma.trip.count(),
      this.prisma.trip.count({ where: { status: 'PLANNED', departureTime: { gte: new Date() } } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.tenant.count(),
      this.prisma.station.findMany({ select: { city: true }, distinct: ['city'] }),
      this.prisma.route.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.station.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { city: true },
        distinct: ['city'],
      }),
    ]);

    return {
      routes,
      trips,
      upcomingTrips,
      confirmedBookings,
      tenants,
      cities: cities.length,
      newRoutes30d: newRoutes,
      newCities30d: newStations.length,
    };
  }

  async findOne(tenantId: string, id: string) {
    const route = await this.prisma.route.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        originStation: true,
        destinationStation: true,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async update(tenantId: string, id: string, updateRouteDto: UpdateRouteDto, actorId?: string) {
    const existing = await this.findOne(tenantId, id);
    const updated = await this.prisma.route.update({
      where: { id },
      data: updateRouteDto,
      include: {
        originStation: true,
        destinationStation: true,
      },
    });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'UPDATE',
      entityType: 'ROUTE', entityId: id,
      oldValues: { title: existing.title, basePrice: existing.basePrice },
      newValues: updateRouteDto,
    });
    return updated;
  }

  async remove(tenantId: string, id: string, actorId?: string) {
    const existing = await this.findOne(tenantId, id);
    const removed = await this.prisma.route.delete({
      where: { id },
    });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'DELETE',
      entityType: 'ROUTE', entityId: id,
      oldValues: { title: existing.title },
    });
    return removed;
  }
}
