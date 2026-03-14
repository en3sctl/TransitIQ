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
exports.RoutesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const pricing_service_1 = require("../shared/pricing/pricing.service");
const location_service_1 = require("../shared/location/location.service");
let RoutesService = class RoutesService {
    prisma;
    pricingService;
    locationService;
    constructor(prisma, pricingService, locationService) {
        this.prisma = prisma;
        this.pricingService = pricingService;
        this.locationService = locationService;
    }
    async create(tenantId, createRouteDto) {
        const { originStationId, destinationStationId, basePrice, taxRate = 0.18, title, totalDistanceKm: providedDistance } = createRouteDto;
        const origin = await this.prisma.station.findUnique({ where: { id: originStationId } });
        const destination = await this.prisma.station.findUnique({ where: { id: destinationStationId } });
        const totalDistanceKm = providedDistance || this.locationService.calculateDistanceKm(origin?.name || 'Unknown', destination?.name || 'Unknown');
        const finalPrice = this.pricingService.calculateFinalPrice(basePrice, taxRate);
        console.log(`Calculated Final Price: ${finalPrice}`);
        return this.prisma.route.create({
            data: {
                title,
                originStationId,
                destinationStationId,
                basePrice,
                taxRate,
                totalDistanceKm,
                tenantId,
            },
            include: {
                originStation: true,
                destinationStation: true,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.route.findMany({
            where: {
                tenantId,
            },
            include: {
                originStation: true,
                destinationStation: true,
            },
        });
    }
    async findOne(tenantId, id) {
        const route = await this.prisma.route.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                originStation: true,
                destinationStation: true,
            },
        });
        if (!route) {
            throw new common_1.NotFoundException(`Route with ID ${id} not found`);
        }
        return route;
    }
    async update(tenantId, id, updateRouteDto) {
        await this.findOne(tenantId, id);
        return this.prisma.route.update({
            where: { id },
            data: updateRouteDto,
            include: {
                originStation: true,
                destinationStation: true,
            },
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.route.delete({
            where: { id },
        });
    }
};
exports.RoutesService = RoutesService;
exports.RoutesService = RoutesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pricing_service_1.PricingService,
        location_service_1.LocationService])
], RoutesService);
//# sourceMappingURL=routes.service.js.map