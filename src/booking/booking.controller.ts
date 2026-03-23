import { Controller, Get, Post, Body, Query, Param, Request, Headers, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { SearchTripsDto, CreateReservationDto, LockSeatsDto } from './dto/booking.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /** Public: search available trips */
  @Get('search')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  search(@Query() searchDto: SearchTripsDto) {
    return this.bookingService.searchTrips(searchDto);
  }

  /** Public: get seat map for a trip */
  @Get('trips/:tripId/seats')
  getTripSeatMap(@Param('tripId') tripId: string) {
    return this.bookingService.getTripSeatMap(tripId);
  }

  /** Session-based seat locking (no auth required - users lock before login) */
  @Post('seats/lock')
  @Throttle({ short: { limit: 3, ttl: 1000 } })
  lockSeats(@Body() lockDto: LockSeatsDto, @Headers('x-session-id') sessionId: string) {
    const resolvedSessionId = sessionId || crypto.randomUUID();
    return this.bookingService.lockSeats({ ...lockDto, sessionId: resolvedSessionId });
  }

  /** Protected: create reservation (requires login) */
  @Post('reservations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createReservation(@Request() req: any, @Body() createDto: CreateReservationDto) {
    // tenantId comes from JWT token, NOT from client
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.bookingService.createReservation({ ...createDto, tenantId, userId });
  }

  /** Public: get ticket by PNR (rate limited to prevent enumeration) */
  @Get('ticket/:pnr')
  @Throttle({ short: { limit: 3, ttl: 10000 } })
  getTicket(@Param('pnr') pnr: string) {
    return this.bookingService.getTicketByPnr(pnr);
  }

  /** Public: get multiple tickets by comma-separated PNRs */
  @Get('tickets')
  @Throttle({ short: { limit: 3, ttl: 10000 } })
  async getTickets(@Query('pnrs') pnrs: string) {
    const pnrList = pnrs.split(',').map((p) => p.trim()).filter(Boolean);
    const tickets = await Promise.all(
      pnrList.map((pnr) => this.bookingService.getTicketByPnr(pnr).catch(() => null))
    );
    return tickets.filter(Boolean);
  }

  /** Protected: cancel booking */
  @Post('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancel(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.bookingService.cancelBooking(tenantId, id);
  }
}
