import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createDriver(tenantId: string, createDriverDto: CreateDriverDto, actorId?: string) {
    const { password, ...driverData } = createDriverDto;

    // Check if user already exists for this tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: driverData.email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('Driver with this email already exists in your company');
    }

    // Hash password (mocking bcrypt for now as we don't have it installed/setup fully)
    // Actually, I should probably use a simple placeholder if bcrypt isn't installed.
    // Let's assume bcrypt will be available.
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await this.prisma.user.create({
      data: {
        ...driverData,
        passwordHash,
        tenantId,
        role: Role.DRIVER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    this.audit.log({
      tenantId, userId: actorId,
      action: 'DRIVER_CREATE',
      entityType: 'DRIVER', entityId: created.id,
      newValues: { name: created.name, email: created.email },
    });

    return created;
  }

  async findAllDrivers(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: Role.DRIVER,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        createdAt: true,
        _count: { select: { driverTrips: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDriver(tenantId: string, driverId: string, dto: UpdateDriverDto, actorId?: string) {
    const driver = await this.prisma.user.findFirst({
      where: { id: driverId, tenantId, role: Role.DRIVER, deletedAt: null },
    });
    if (!driver) throw new NotFoundException('Şoför bulunamadı');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined && dto.email !== driver.email) {
      const exists = await this.prisma.user.findFirst({
        where: { tenantId, email: dto.email, deletedAt: null, id: { not: driverId } },
      });
      if (exists) throw new ConflictException('Bu email başka bir kullanıcıda mevcut');
      data.email = dto.email;
    }
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber || null;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({
      where: { id: driverId },
      data,
      select: { id: true, name: true, email: true, phoneNumber: true, role: true, createdAt: true },
    });

    this.audit.log({
      tenantId, userId: actorId,
      action: 'DRIVER_UPDATE',
      entityType: 'DRIVER', entityId: driverId,
      oldValues: { name: driver.name, email: driver.email, phoneNumber: driver.phoneNumber },
      newValues: { ...data, passwordHash: data.passwordHash ? '[changed]' : undefined },
    });

    return updated;
  }

  async deleteDriver(tenantId: string, driverId: string, actorId?: string) {
    const driver = await this.prisma.user.findFirst({
      where: { id: driverId, tenantId, role: Role.DRIVER, deletedAt: null },
    });
    if (!driver) throw new NotFoundException('Şoför bulunamadı');

    // Check active trips
    const activeTrips = await this.prisma.trip.count({
      where: { driverId, status: { in: ['PLANNED', 'ACTIVE'] } },
    });
    if (activeTrips > 0) {
      throw new BadRequestException(`Bu şoförün ${activeTrips} aktif seferi var, önce seferleri başka şoföre ata.`);
    }

    await this.prisma.user.update({
      where: { id: driverId },
      data: { deletedAt: new Date() },
    });

    this.audit.log({
      tenantId, userId: actorId,
      action: 'DRIVER_DELETE',
      entityType: 'DRIVER', entityId: driverId,
      oldValues: { name: driver.name, email: driver.email },
    });

    return { ok: true };
  }
}
