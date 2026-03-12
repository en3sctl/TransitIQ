import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';
export declare class DriverOpsService {
    private prisma;
    constructor(prisma: PrismaService);
    getTodayTrips(tenantId: string, driverId: string): Promise<({
        vehicle: {
            plateNumber: string;
            capacity: number;
            fuelConsumptionPer100km: number;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
        };
        route: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            title: string;
            startLocation: string;
            endLocation: string;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
            totalDistanceKm: number;
        };
    } & {
        status: import("@prisma/client").$Enums.TripStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        routeId: string;
        vehicleId: string;
        driverId: string;
        endTime: Date | null;
        startTime: Date;
    })[]>;
    updateTripStatus(tenantId: string, driverId: string, tripId: string, updateTripStatusDto: UpdateTripStatusDto): Promise<{
        status: import("@prisma/client").$Enums.TripStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        routeId: string;
        vehicleId: string;
        driverId: string;
        endTime: Date | null;
        startTime: Date;
    }>;
    logLocation(tenantId: string, driverId: string, tripId: string, locationDto: LocationDto): Promise<{
        success: boolean;
        timestamp: Date;
    }>;
    createExpense(tenantId: string, driverId: string, tripId: string, createExpenseDto: CreateExpenseDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        driverId: string;
        description: string;
        tripId: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        category: string;
    }>;
}
