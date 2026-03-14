import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { PricingService } from '../shared/pricing/pricing.service';
import { LocationService } from '../shared/location/location.service';
export declare class RoutesService {
    private prisma;
    private pricingService;
    private locationService;
    constructor(prisma: PrismaService, pricingService: PricingService, locationService: LocationService);
    create(tenantId: string, createRouteDto: CreateRouteDto): Promise<{
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
    findAll(tenantId: string): Promise<({
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
    findOne(tenantId: string, id: string): Promise<{
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
    update(tenantId: string, id: string, updateRouteDto: UpdateRouteDto): Promise<{
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
    remove(tenantId: string, id: string): Promise<{
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
