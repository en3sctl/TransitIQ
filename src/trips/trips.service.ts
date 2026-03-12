import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TripsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const tenantId = 'test-firma-123';
      const adminId = 'test-admin-id';

      // Ensure Tenant
      await (this.prisma as any).tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
          id: tenantId,
          name: 'Test Firma 123',
          slug: 'test-firma-123',
          domain: 'test-firma-123.com',
        },
      });

      // Ensure Admin User for FK
      await (this.prisma as any).user.upsert({
        where: { id: adminId },
        update: { role: 'COMPANY_ADMIN' },
        create: {
          id: adminId,
          email: 'admin@test.com',
          name: 'Mock Admin',
          role: 'COMPANY_ADMIN',
          passwordHash: 'mock-hash', // Using a placeholder for mock auth
          tenantId,
        },
      });
      console.log('--- Mock Admin & Tenant Seeded Successfully ---');
    } catch (error) {
      console.error('Failed to seed mock data in TripsService:', error);
    }
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).trip.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        route: true,
        vehicle: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async create(tenantId: string, dto: any) {
    try {
      console.log('Creating trip for tenant:', tenantId, 'with data:', dto);
      const departureTime = new Date(dto.departureTime);
      if (isNaN(departureTime.getTime())) {
        throw new Error(`Invalid departureTime provided: ${dto.departureTime}`);
      }

      return await (this.prisma as any).trip.create({
        data: {
          tenantId,
          routeId: dto.routeId,
          vehicleId: dto.vehicleId,
          driverId: dto.driverId || 'test-admin-id',
          startTime: departureTime,
          endTime: dto.endTime ? new Date(dto.endTime) : null,
          status: 'PENDING',
        },
      });
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  }

  async findOne(tenantId: string, id: string) {
    const trip = await (this.prisma as any).trip.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        route: true,
        vehicle: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    return trip;
  }
}
