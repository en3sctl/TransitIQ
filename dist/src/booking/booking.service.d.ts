import { PrismaService } from '../common/prisma/prisma.service';
import { SearchTripsDto, CreateReservationDto } from './dto/booking.dto';
export declare class BookingService {
    private prisma;
    constructor(prisma: PrismaService);
    searchTrips(searchDto: SearchTripsDto): Promise<{
        availableSeats: number;
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
        reservations: {
            status: import("@prisma/client").$Enums.ReservationStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            tripId: string;
            seatNumber: number;
            passengerId: string;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            pnrCode: string;
        }[];
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
    }[]>;
    createReservation(createDto: CreateReservationDto & {
        tenantId: string;
        passengerId: string;
    }): Promise<{
        status: import("@prisma/client").$Enums.ReservationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        tripId: string;
        seatNumber: number;
        passengerId: string;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        pnrCode: string;
    }>;
    payReservation(tenantId: string, reservationId: string): Promise<{
        status: import("@prisma/client").$Enums.ReservationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        tripId: string;
        seatNumber: number;
        passengerId: string;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        pnrCode: string;
    }>;
    private generatePnrCode;
}
