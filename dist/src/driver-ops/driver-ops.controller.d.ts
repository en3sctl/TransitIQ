import { DriverOpsService } from './driver-ops.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';
export declare class DriverOpsController {
    private readonly driverOpsService;
    constructor(driverOpsService: DriverOpsService);
    getTodayTrips(req: any): Promise<({
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
    updateTripStatus(req: any, tripId: string, updateTripStatusDto: UpdateTripStatusDto): Promise<{
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
    logLocation(req: any, tripId: string, locationDto: LocationDto): Promise<{
        success: boolean;
        timestamp: Date;
    }>;
    createExpense(req: any, tripId: string, createExpenseDto: CreateExpenseDto): Promise<{
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
