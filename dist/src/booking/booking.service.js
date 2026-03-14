"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let BookingService = class BookingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchTrips(searchDto) {
        const { tenantId, startLocation, endLocation, date } = searchDto;
        const searchDate = new Date(date);
        searchDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const trips = await this.prisma.trip.findMany({
            where: {
                tenantId,
                status: client_1.TripStatus.PLANNED,
                departureTime: {
                    gte: searchDate,
                    lt: nextDay,
                },
                route: {
                    OR: [
                        { originStation: { name: { contains: startLocation, mode: 'insensitive' } } },
                        { destinationStation: { name: { contains: endLocation, mode: 'insensitive' } } },
                        { stops: { some: { station: { name: { contains: startLocation, mode: 'insensitive' } } } } }
                    ]
                },
            },
            include: {
                route: {
                    include: {
                        originStation: true,
                        destinationStation: true,
                    }
                },
                vehicle: true,
                bookings: {
                    where: {
                        status: { in: [client_1.BookingStatus.CONFIRMED] },
                    },
                },
            },
        });
        return trips.map(trip => {
            const takenSeats = trip.bookings.length;
            const availableSeats = trip.vehicle.capacity - takenSeats;
            return {
                ...trip,
                availableSeats,
            };
        }).filter(trip => trip.availableSeats > 0);
    }
    async createReservation(createDto) {
        const { tenantId, tripId, userId, seatId } = createDto;
        const trip = await this.prisma.trip.findFirst({
            where: { id: tripId, tenantId },
            include: { vehicle: true, route: true },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        const existingBooking = await this.prisma.booking.findFirst({
            where: {
                tripId,
                seatId,
                status: { in: [client_1.BookingStatus.CONFIRMED] },
            },
        });
        if (existingBooking) {
            throw new common_1.ConflictException(`Seat is already occupied`);
        }
        const pnrCode = this.generatePnrCode();
        return this.prisma.booking.create({
            data: {
                tenantId,
                tripId,
                userId,
                seatId,
                pnrCode,
                status: client_1.BookingStatus.CONFIRMED,
                pricePaid: trip.route.basePrice,
            },
        });
    }
    async cancelBooking(tenantId, bookingId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, tenantId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.CANCELLED,
            },
        });
    }
    generatePnrCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingService);
//# sourceMappingURL=booking.service.js.map