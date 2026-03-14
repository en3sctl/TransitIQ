import { DriverOpsService } from './driver-ops.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';
export declare class DriverOpsController {
    private readonly driverOpsService;
    constructor(driverOpsService: DriverOpsService);
    getTodayTrips(req: any): Promise<({
        vehicle: {
            capacity: number;
            status: import("@prisma/client").$Enums.VehicleStatus;
            id: string;
            make: string | null;
            model: string | null;
            year: number | null;
            registrationPlate: string;
            chassisNumber: string | null;
            engineNumber: string | null;
            muayeneTarihi: Date | null;
            sigortaTarihi: Date | null;
            currentMileage: number;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
        };
        route: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            title: string;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
            originStationId: string;
            destinationStationId: string;
            totalDistanceKm: number;
        };
    } & {
        status: import("@prisma/client").$Enums.TripStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        routeId: string;
        vehicleId: string;
        driverId: string;
        departureTime: Date;
        assistantDriverId: string | null;
        hostessId: string | null;
        estimatedArrival: Date | null;
        actualArrival: Date | null;
        notes: string | null;
    })[]>;
    updateTripStatus(req: any, tripId: string, updateTripStatusDto: UpdateTripStatusDto): Promise<{
        status: import("@prisma/client").$Enums.TripStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        routeId: string;
        vehicleId: string;
        driverId: string;
        departureTime: Date;
        assistantDriverId: string | null;
        hostessId: string | null;
        estimatedArrival: Date | null;
        actualArrival: Date | null;
        notes: string | null;
    }>;
    logLocation(req: any, tripId: string, locationDto: LocationDto): Promise<{
        success: boolean;
        timestamp: Date;
    }>;
    createExpense(req: any, tripId: string, createExpenseDto: CreateExpenseDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
