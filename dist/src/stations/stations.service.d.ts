import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
export declare class StationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, createDto: CreateStationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    update(tenantId: string, id: string, updateDto: UpdateStationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
}
