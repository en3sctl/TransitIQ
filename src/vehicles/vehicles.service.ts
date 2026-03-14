import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { VehicleStatus } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createVehicleDto: CreateVehicleDto) {
    const { plateNumber, ...rest } = createVehicleDto as any;
    return this.prisma.vehicle.create({
      data: {
        ...rest,
        registrationPlate: plateNumber,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.vehicle.findMany({
      where: {
        tenantId,
        deletedAt: null,
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
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async update(tenantId: string, id: string, updateVehicleDto: UpdateVehicleDto) {
    // Ensure vehicle belongs to tenant before update
    await this.findOne(tenantId, id);

    const { plateNumber, status, ...rest } = updateVehicleDto as any;
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...rest,
        ...(plateNumber && { registrationPlate: plateNumber }),
        ...(status && { status: status as VehicleStatus }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Ensure vehicle belongs to tenant before soft delete
    await this.findOne(tenantId, id);

    return this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
