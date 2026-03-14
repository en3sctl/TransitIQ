"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let TripsService = class TripsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            const tenantId = 'test-firma-123';
            const adminId = 'test-admin-id';
            await this.prisma.tenant.upsert({
                where: { id: tenantId },
                update: {},
                create: {
                    id: tenantId,
                    name: 'Test Firma 123',
                    slug: 'test-firma-123',
                    domain: 'test-firma-123.com',
                },
            });
            await this.prisma.user.upsert({
                where: { id: adminId },
                update: { role: 'COMPANY_ADMIN' },
                create: {
                    id: adminId,
                    email: 'admin@test.com',
                    name: 'Mock Admin',
                    role: 'COMPANY_ADMIN',
                    passwordHash: 'mock-hash',
                    tenantId,
                },
            });
            console.log('--- Mock Admin & Tenant Seeded Successfully ---');
        }
        catch (error) {
            console.error('Failed to seed mock data in TripsService:', error);
        }
    }
    async findAll(tenantId) {
        return this.prisma.trip.findMany({
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
    async create(tenantId, dto) {
        try {
            console.log('Creating trip for tenant:', tenantId, 'with data:', dto);
            const departureTime = new Date(dto.departureTime);
            if (isNaN(departureTime.getTime())) {
                throw new Error(`Invalid departureTime provided: ${dto.departureTime}`);
            }
            return await this.prisma.trip.create({
                data: {
                    tenantId,
                    routeId: dto.routeId,
                    vehicleId: dto.vehicleId,
                    driverId: dto.driverId || 'test-admin-id',
                    departureTime: departureTime,
                    status: 'PLANNED',
                },
            });
        }
        catch (error) {
            console.error('Error creating trip:', error);
            throw error;
        }
    }
    async findOne(tenantId, id) {
        const trip = await this.prisma.trip.findFirst({
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
            throw new common_1.NotFoundException(`Trip with ID ${id} not found`);
        }
        return trip;
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TripsService);
//# sourceMappingURL=trips.service.js.map