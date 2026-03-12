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
    const { startLocation, endLocation, basePrice, taxRate } = createRouteDto;

    // Use LocationService mock to calculate distance
    const totalDistanceKm = this.locationService.calculateDistanceKm(startLocation, endLocation);

    // Final price calculation (logic in PricingService)
    const finalPrice = this.pricingService.calculateFinalPrice(basePrice, taxRate);
    console.log(`Calculated Final Price: ${finalPrice}`);

    return (this.prisma as any).route.create({
      data: {
        ...createRouteDto,
        totalDistanceKm,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).route.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const route = await (this.prisma as any).route.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async update(tenantId: string, id: string, updateRouteDto: UpdateRouteDto) {
    await this.findOne(tenantId, id);

    return (this.prisma as any).route.update({
      where: { id },
      data: updateRouteDto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return (this.prisma as any).route.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
