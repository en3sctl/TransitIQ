import { StationsService } from './stations.service';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
export declare class StationsController {
    private readonly stationsService;
    constructor(stationsService: StationsService);
    create(req: any, createDto: CreateStationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }[]>;
    findOne(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    update(req: any, id: string, updateDto: UpdateStationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        city: string;
        locationLat: import("@prisma/client-runtime-utils").Decimal | null;
        locationLng: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    remove(req: any, id: string): Promise<{
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
