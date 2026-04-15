import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';

@Injectable()
export class StationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(tenantId: string, createDto: CreateStationDto, actorId?: string) {
    const created = await this.prisma.station.create({
      data: { ...createDto, tenantId },
    });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'CREATE',
      entityType: 'STATION', entityId: created.id,
      newValues: { name: created.name, city: created.city },
    });
    return created;
  }

  async findAll(tenantId?: string) {
    return this.prisma.station.findMany({
      where: tenantId ? { tenantId } : {},
    });
  }

  async findOne(tenantId: string, id: string) {
    const station = await this.prisma.station.findFirst({
      where: { id, tenantId },
    });
    if (!station) {
      throw new NotFoundException('Station not found');
    }
    return station;
  }

  async update(tenantId: string, id: string, updateDto: UpdateStationDto, actorId?: string) {
    const existing = await this.findOne(tenantId, id);
    const updated = await this.prisma.station.update({
      where: { id },
      data: updateDto,
    });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'UPDATE',
      entityType: 'STATION', entityId: id,
      oldValues: { name: existing.name, city: existing.city },
      newValues: updateDto,
    });
    return updated;
  }

  async remove(tenantId: string, id: string, actorId?: string) {
    const existing = await this.findOne(tenantId, id);
    const removed = await this.prisma.station.delete({
      where: { id },
    });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'DELETE',
      entityType: 'STATION', entityId: id,
      oldValues: { name: existing.name, city: existing.city },
    });
    return removed;
  }
}
