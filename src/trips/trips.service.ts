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
