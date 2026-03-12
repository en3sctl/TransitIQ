import { Controller, Get, Post, Body, Query, Param, Patch } from '@nestjs/common';
import { BookingService } from './booking.service';
import { SearchTripsDto, CreateReservationDto } from './dto/booking.dto';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('search')
  search(@Query() searchDto: SearchTripsDto) {
    return this.bookingService.searchTrips(searchDto);
  }

  @Post('reservations')
  createReservation(@Body() createDto: CreateReservationDto) {
    // In a real app, tenantId and passengerId might be taken from JWT if authenticated
    // or passed in body for public bookings.
    return this.bookingService.createReservation(createDto);
  }

  @Post('reservations/:id/pay')
  pay(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.bookingService.payReservation(tenantId, id);
  }
}
