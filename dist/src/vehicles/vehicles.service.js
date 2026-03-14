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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let VehiclesService = class VehiclesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, createVehicleDto) {
        const { plateNumber, ...rest } = createVehicleDto;
        return this.prisma.vehicle.create({
            data: {
                ...rest,
                registrationPlate: plateNumber,
                tenantId,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.vehicle.findMany({
            where: {
                tenantId,
                deletedAt: null,
            },
        });
    }
    async findOne(tenantId, id) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id,
                tenantId,
                deletedAt: null,
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException(`Vehicle with ID ${id} not found`);
        }
        return vehicle;
    }
    async update(tenantId, id, updateVehicleDto) {
        await this.findOne(tenantId, id);
        const { plateNumber, status, ...rest } = updateVehicleDto;
        return this.prisma.vehicle.update({
            where: { id },
            data: {
                ...rest,
                ...(plateNumber && { registrationPlate: plateNumber }),
                ...(status && { status: status }),
            },
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.vehicle.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map