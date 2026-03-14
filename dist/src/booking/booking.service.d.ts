import { PrismaService } from '../common/prisma/prisma.service';
import { SearchTripsDto } from './dto/booking.dto';
export declare class BookingService {
    private prisma;
    constructor(prisma: PrismaService);
    searchTrips(searchDto: SearchTripsDto): Promise<{
        availableSeats: number;
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
        };
        bookings: {
            status: import("@prisma/client").$Enums.BookingStatus;
            id: string;
            tenantId: string;
            tripId: string;
            seatId: string;
            userId: string;
            pricePaid: import("@prisma/client-runtime-utils").Decimal;
            bookingTime: Date;
            pnrCode: string;
        }[];
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
    }[]>;
    createReservation(createDto: any & {
        tenantId: string;
        userId: string;
    }): Promise<{
        status: import("@prisma/client").$Enums.BookingStatus;
        id: string;
        tenantId: string;
        tripId: string;
        seatId: string;
        userId: string;
        pricePaid: import("@prisma/client-runtime-utils").Decimal;
        bookingTime: Date;
        pnrCode: string;
    }>;
    cancelBooking(tenantId: string, bookingId: string): Promise<{
        status: import("@prisma/client").$Enums.BookingStatus;
        id: string;
        tenantId: string;
        tripId: string;
        seatId: string;
        userId: string;
        pricePaid: import("@prisma/client-runtime-utils").Decimal;
        bookingTime: Date;
        pnrCode: string;
    }>;
    private generatePnrCode;
}
