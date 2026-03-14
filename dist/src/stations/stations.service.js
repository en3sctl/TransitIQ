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
exports.StationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let StationsService = class StationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, createDto) {
        return this.prisma.station.create({
            data: {
                ...createDto,
                tenantId,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.station.findMany({
            where: { tenantId },
        });
    }
    async findOne(tenantId, id) {
        const station = await this.prisma.station.findFirst({
            where: { id, tenantId },
        });
        if (!station) {
            throw new common_1.NotFoundException('Station not found');
        }
        return station;
    }
    async update(tenantId, id, updateDto) {
        await this.findOne(tenantId, id);
        return this.prisma.station.update({
            where: { id },
            data: updateDto,
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.station.delete({
            where: { id },
        });
    }
};
exports.StationsService = StationsService;
exports.StationsService = StationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StationsService);
//# sourceMappingURL=stations.service.js.map