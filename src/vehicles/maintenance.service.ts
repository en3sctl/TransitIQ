import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';

export interface MaintenanceDto {
  type: string;
  description?: string;
  cost?: number;
  odometerAt?: number;
  performedAt: string;
  performedBy?: string;
  nextDueAt?: string;
  nextDueKm?: number;
  attachmentUrl?: string;
}

export interface FuelLogDto {
  tripId?: string;
  liters: number;
  pricePerL: number;
  totalCost: number;
  odometerAt: number;
  station?: string;
  fueledAt: string;
  fueledBy?: string;
}

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private async assertTenantOwnsVehicle(tenantId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId, deletedAt: null },
    });
    if (!vehicle) throw new ForbiddenException('Araç bu şirkete ait değil');
    return vehicle;
  }

  // ─── Maintenance ───
  async listMaintenance(tenantId: string, vehicleId: string) {
    await this.assertTenantOwnsVehicle(tenantId, vehicleId);
    return this.prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      orderBy: { performedAt: 'desc' },
    });
  }

  async createMaintenance(tenantId: string, vehicleId: string, dto: MaintenanceDto, actorId: string) {
    await this.assertTenantOwnsVehicle(tenantId, vehicleId);
    const created = await this.prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        type: dto.type,
        description: dto.description || null,
        cost: dto.cost !== undefined ? dto.cost : null,
        odometerAt: dto.odometerAt !== undefined ? dto.odometerAt : null,
        performedAt: new Date(dto.performedAt),
        performedBy: dto.performedBy || null,
        nextDueAt: dto.nextDueAt ? new Date(dto.nextDueAt) : null,
        nextDueKm: dto.nextDueKm !== undefined ? dto.nextDueKm : null,
        attachmentUrl: dto.attachmentUrl || null,
        createdBy: actorId,
      },
    });

    // Update vehicle odometer if this record has a higher reading
    if (dto.odometerAt !== undefined) {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          currentMileage: { set: Math.max(0, dto.odometerAt) },
        },
      });
    }

    this.audit.log({
      tenantId, userId: actorId,
      action: 'CREATE',
      entityType: 'VEHICLE', entityId: vehicleId,
      newValues: { maintenanceType: dto.type, performedAt: dto.performedAt, cost: dto.cost },
    });

    return created;
  }

  async deleteMaintenance(tenantId: string, recordId: string, actorId: string) {
    const record = await this.prisma.maintenanceRecord.findUnique({
      where: { id: recordId },
      include: { vehicle: true },
    });
    if (!record || record.vehicle.tenantId !== tenantId) {
      throw new NotFoundException('Kayıt bulunamadı');
    }
    await this.prisma.maintenanceRecord.delete({ where: { id: recordId } });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'DELETE',
      entityType: 'VEHICLE', entityId: record.vehicleId,
      oldValues: { maintenanceType: record.type, recordId },
    });
    return { ok: true };
  }

  // ─── Fuel Logs ───
  async listFuel(tenantId: string, vehicleId: string) {
    await this.assertTenantOwnsVehicle(tenantId, vehicleId);
    return this.prisma.fuelLog.findMany({
      where: { vehicleId },
      orderBy: { fueledAt: 'desc' },
    });
  }

  async createFuel(tenantId: string, vehicleId: string, dto: FuelLogDto, actorId: string) {
    await this.assertTenantOwnsVehicle(tenantId, vehicleId);
    const created = await this.prisma.fuelLog.create({
      data: {
        vehicleId,
        tripId: dto.tripId || null,
        liters: dto.liters,
        pricePerL: dto.pricePerL,
        totalCost: dto.totalCost,
        odometerAt: dto.odometerAt,
        station: dto.station || null,
        fueledAt: new Date(dto.fueledAt),
        fueledBy: dto.fueledBy || null,
      },
    });

    // Update vehicle odometer
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentMileage: dto.odometerAt },
    });

    return created;
  }

  async deleteFuel(tenantId: string, logId: string, actorId: string) {
    const log = await this.prisma.fuelLog.findUnique({
      where: { id: logId },
      include: { vehicle: true },
    });
    if (!log || log.vehicle.tenantId !== tenantId) {
      throw new NotFoundException('Kayıt bulunamadı');
    }
    await this.prisma.fuelLog.delete({ where: { id: logId } });
    return { ok: true };
  }

  // ─── Vehicle Summary ───
  /**
   * Returns a full lifecycle view of a vehicle: details, maintenance history,
   * fuel economy, upcoming inspection/insurance deadlines.
   */
  async getVehicleSummary(tenantId: string, vehicleId: string) {
    const vehicle = await this.assertTenantOwnsVehicle(tenantId, vehicleId);

    const [maintenance, fuel, tripCount, bookingCount] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where: { vehicleId },
        orderBy: { performedAt: 'desc' },
        take: 20,
      }),
      this.prisma.fuelLog.findMany({
        where: { vehicleId },
        orderBy: { fueledAt: 'desc' },
        take: 20,
      }),
      this.prisma.trip.count({ where: { vehicleId } }),
      this.prisma.booking.count({
        where: { trip: { vehicleId }, status: 'CONFIRMED' },
      }),
    ]);

    // Fuel economy calc (km per liter, last 10 entries)
    const last10 = fuel.slice(0, 10).reverse();
    let economyKmPerL: number | null = null;
    if (last10.length >= 2) {
      const totalKm = last10[last10.length - 1].odometerAt - last10[0].odometerAt;
      const totalL = last10.slice(1).reduce((s, f) => s + Number(f.liters), 0);
      if (totalKm > 0 && totalL > 0) economyKmPerL = Math.round((totalKm / totalL) * 10) / 10;
    }

    const today = new Date();
    const in30days = new Date(today.getTime() + 30 * 86400000);
    const upcomingInspection = vehicle.muayeneTarihi && vehicle.muayeneTarihi <= in30days && vehicle.muayeneTarihi > today
      ? vehicle.muayeneTarihi
      : null;
    const upcomingInsurance = vehicle.sigortaTarihi && vehicle.sigortaTarihi <= in30days && vehicle.sigortaTarihi > today
      ? vehicle.sigortaTarihi
      : null;
    const overdueInspection = vehicle.muayeneTarihi && vehicle.muayeneTarihi < today
      ? vehicle.muayeneTarihi
      : null;
    const overdueInsurance = vehicle.sigortaTarihi && vehicle.sigortaTarihi < today
      ? vehicle.sigortaTarihi
      : null;

    const totalMaintenanceCost = maintenance.reduce((s, r) => s + Number(r.cost || 0), 0);
    const totalFuelCost = fuel.reduce((s, r) => s + Number(r.totalCost), 0);

    return {
      vehicle,
      stats: {
        tripCount,
        bookingCount,
        totalMaintenanceCost,
        totalFuelCost,
        economyKmPerL,
      },
      alerts: {
        upcomingInspection,
        upcomingInsurance,
        overdueInspection,
        overdueInsurance,
      },
      maintenance,
      fuel,
    };
  }
}
