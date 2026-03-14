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
exports.DriverOpsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let DriverOpsService = class DriverOpsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTodayTrips(tenantId, driverId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.prisma.trip.findMany({
            where: {
                tenantId,
                driverId,
                departureTime: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                route: true,
                vehicle: true,
            },
        });
    }
    async updateTripStatus(tenantId, driverId, tripId, updateTripStatusDto) {
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: tripId,
                tenantId,
                driverId,
            },
        });
        if (!trip) {
            throw new common_1.NotFoundException(`Trip with ID ${tripId} not found or not assigned to you`);
        }
        return this.prisma.trip.update({
            where: { id: tripId },
            data: { status: updateTripStatusDto.status },
        });
    }
    async logLocation(tenantId, driverId, tripId, locationDto) {
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: tripId,
                tenantId,
                driverId,
            },
        });
        if (!trip) {
            throw new common_1.ForbiddenException(`You are not authorized to log location for trip ${tripId}`);
        }
        console.log(`[LIVE LOCATION] Tenant: ${tenantId}, Driver: ${driverId}, Trip: ${tripId}, Lat: ${locationDto.latitude}, Lng: ${locationDto.longitude}`);
        return { success: true, timestamp: new Date() };
    }
    async createExpense(tenantId, driverId, tripId, createExpenseDto) {
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: tripId,
                tenantId,
                driverId,
            },
        });
        if (!trip) {
            throw new common_1.ForbiddenException(`You are not authorized to submit expenses for trip ${tripId}`);
        }
        console.log(`[EXPENSE BLOCKED] Tenant: ${tenantId}, Trip: ${tripId}, Model no longer exists.`);
        return { success: false, message: 'Expense tracking is temporarily disabled.' };
    }
};
exports.DriverOpsService = DriverOpsService;
exports.DriverOpsService = DriverOpsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DriverOpsService);
//# sourceMappingURL=driver-ops.service.js.map