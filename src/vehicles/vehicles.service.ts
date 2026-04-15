import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { VehicleStatus, SeatType } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(tenantId: string, createVehicleDto: CreateVehicleDto, actorId?: string) {
    const { capacity, layoutType, ...rest } = createVehicleDto;

    // Create vehicle + auto-generate seats in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          ...rest,
          capacity,
          layoutType,
          tenantId,
        },
      });

      const [left, right] = layoutType.split('+').map(Number);
      const seatType = left + right <= 3 ? SeatType.VIP : SeatType.STANDARD;

      const seatData = Array.from({ length: capacity }, (_, i) => ({
        vehicleId: vehicle.id,
        seatNumber: i + 1,
        type: seatType,
      }));

      await tx.seat.createMany({ data: seatData });

      return tx.vehicle.findUnique({
        where: { id: vehicle.id },
        include: { seats: { orderBy: { seatNumber: 'asc' } } },
      });
    });

    if (result) {
      this.audit.log({
        tenantId, userId: actorId,
        action: 'CREATE',
        entityType: 'VEHICLE', entityId: result.id,
        newValues: { registrationPlate: result.registrationPlate, capacity: result.capacity, layoutType: result.layoutType },
      });
    }

    return result;
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

  async update(tenantId: string, id: string, updateVehicleDto: UpdateVehicleDto, actorId?: string) {
    const existing = await this.findOne(tenantId, id);

    const { status, ...rest } = updateVehicleDto;
    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status: status as VehicleStatus }),
      },
    });

    this.audit.log({
      tenantId, userId: actorId,
      action: 'UPDATE',
      entityType: 'VEHICLE', entityId: id,
      oldValues: { registrationPlate: existing.registrationPlate, status: existing.status },
      newValues: updateVehicleDto,
    });

    return updated;
  }

  async remove(tenantId: string, id: string, actorId?: string) {
    const existing = await this.findOne(tenantId, id);

    const removed = await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.audit.log({
      tenantId, userId: actorId,
      action: 'DELETE',
      entityType: 'VEHICLE', entityId: id,
      oldValues: { registrationPlate: existing.registrationPlate },
    });

    return removed;
  }
}
