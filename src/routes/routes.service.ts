import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { PricingService } from '../shared/pricing/pricing.service';
import { LocationService } from '../shared/location/location.service';

@Injectable()
export class RoutesService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private locationService: LocationService,
  ) {}

  async create(tenantId: string, createRouteDto: CreateRouteDto) {
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

    return this.prisma.route.create({
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

  async update(tenantId: string, id: string, updateRouteDto: UpdateRouteDto) {
    await this.findOne(tenantId, id);

    return this.prisma.route.update({
      where: { id },
      data: updateRouteDto,
      include: {
        originStation: true,
        destinationStation: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.route.delete({
      where: { id },
    });
  }
}
