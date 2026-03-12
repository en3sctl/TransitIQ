import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
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
  createReservation(@Request() req: any, @Body() createDto: CreateReservationDto) {
    const tenantId = req.user.tenantId;
    const passengerId = req.user.id;
    return this.bookingService.createReservation({
      ...(createDto as any),
      tenantId,
      passengerId,
    });
  }

  @Post('reservations/:id/pay')
  pay(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.bookingService.payReservation(tenantId, id);
  }
}
