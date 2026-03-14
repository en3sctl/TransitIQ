import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';
export declare class DriverOpsService {
    private prisma;
    constructor(prisma: PrismaService);
    getTodayTrips(tenantId: string, driverId: string): Promise<({
        vehicle: {
            registrationPlate: string;
            make: string | null;
            model: string | null;
            year: number | null;
            chassisNumber: string | null;
            capacity: number;
            status: import("@prisma/client").$Enums.VehicleStatus;
            id: string;
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
            originStationId: string;
            destinationStationId: string;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            totalDistanceKm: number;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
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
    updateTripStatus(tenantId: string, driverId: string, tripId: string, updateTripStatusDto: UpdateTripStatusDto): Promise<{
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
    logLocation(tenantId: string, driverId: string, tripId: string, locationDto: LocationDto): Promise<{
        success: boolean;
        timestamp: Date;
    }>;
    createExpense(tenantId: string, driverId: string, tripId: string, createExpenseDto: CreateExpenseDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
