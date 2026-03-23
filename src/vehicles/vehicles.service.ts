import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { VehicleStatus, SeatType } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createVehicleDto: CreateVehicleDto) {
    const { capacity, layoutType, ...rest } = createVehicleDto;

    // Create vehicle + auto-generate seats in a transaction
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          ...rest,
          capacity,
          layoutType,
          tenantId,
        },
      });

      // Parse layout: "2+1" → left=2, right=1
      const [left, right] = layoutType.split('+').map(Number);

      // Determine seat type based on layout
      const seatType = left + right <= 3 ? SeatType.VIP : SeatType.STANDARD;

      // Generate seat records
      const seatData = Array.from({ length: capacity }, (_, i) => ({
        vehicleId: vehicle.id,
        seatNumber: i + 1,
        type: seatType,
      }));

      await tx.seat.createMany({ data: seatData });

      // Return vehicle with seats
      return tx.vehicle.findUnique({
        where: { id: vehicle.id },
        include: { seats: { orderBy: { seatNumber: 'asc' } } },
      });
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.vehicle.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        _count: { select: { seats: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        seats: { orderBy: { seatNumber: 'asc' } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async update(tenantId: string, id: string, updateVehicleDto: UpdateVehicleDto) {
    await this.findOne(tenantId, id);

    const { status, ...rest } = updateVehicleDto;
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status: status as VehicleStatus }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
