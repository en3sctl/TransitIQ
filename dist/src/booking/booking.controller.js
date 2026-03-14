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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const common_1 = require("@nestjs/common");
const booking_service_1 = require("./booking.service");
const booking_dto_1 = require("./dto/booking.dto");
const swagger_1 = require("@nestjs/swagger");
let BookingController = class BookingController {
    bookingService;
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    search(searchDto) {
        return this.bookingService.searchTrips(searchDto);
    }
    createReservation(req, createDto) {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        return this.bookingService.createReservation({
            ...createDto,
            tenantId,
            userId,
        });
    }
    cancel(req, id) {
        const tenantId = req.user.tenantId;
        return this.bookingService.cancelBooking(tenantId, id);
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_dto_1.SearchTripsDto]),
    __metadata("design:returntype", void 0)
], BookingController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('reservations'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, booking_dto_1.CreateReservationDto]),
    __metadata("design:returntype", void 0)
], BookingController.prototype, "createReservation", null);
__decorate([
    (0, common_1.Post)('bookings/:id/cancel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingController.prototype, "cancel", null);
exports.BookingController = BookingController = __decorate([
    (0, swagger_1.ApiTags)('Booking'),
    (0, common_1.Controller)('booking'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingController);
//# sourceMappingURL=booking.controller.js.map