import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
export declare class RoutesController {
    private readonly routesService;
    constructor(routesService: RoutesService);
    create(req: any, createRouteDto: CreateRouteDto): Promise<{
        originStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
        destinationStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        originStationId: string;
        destinationStationId: string;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        totalDistanceKm: number;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
    }>;
    findAll(req: any): Promise<({
        originStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
        destinationStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        originStationId: string;
        destinationStationId: string;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        totalDistanceKm: number;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
    })[]>;
    findOne(req: any, id: string): Promise<{
        originStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
        destinationStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        originStationId: string;
        destinationStationId: string;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        totalDistanceKm: number;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
    }>;
    update(req: any, id: string, updateRouteDto: UpdateRouteDto): Promise<{
        originStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
        destinationStation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            city: string;
            locationLat: import("@prisma/client-runtime-utils").Decimal | null;
            locationLng: import("@prisma/client-runtime-utils").Decimal | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        originStationId: string;
        destinationStationId: string;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        totalDistanceKm: number;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        originStationId: string;
        destinationStationId: string;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        totalDistanceKm: number;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
    }>;
}
