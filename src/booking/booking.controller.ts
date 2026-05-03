import { Controller, Get, Post, Body, Query, Param, Request, Headers, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { BookingService } from './booking.service';
import { SearchTripsDto, CreateReservationDto, LockSeatsDto, CancelBookingDto } from './dto/booking.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Booking')
@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  /** Public: search available trips */
  @Get('search')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  search(@Query() searchDto: SearchTripsDto) {
    return this.bookingService.searchTrips(searchDto);
  }

  /** Public: 7-day price/availability strip for the results page ribbon */
  @Get('search/price-strip')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  priceStrip(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('date') date: string,
    @Query('days') days?: string,
  ) {
    const span = days ? Math.min(Math.max(parseInt(days, 10) || 7, 3), 14) : 7;
    return this.bookingService.getPriceStrip({ from, to, centerDate: date, days: span });
  }

  /** Public: find multi-leg (transfer) options through hub cities */
  @Get('search/multi-leg')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  searchMultiLeg(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('date') date: string,
  ) {
    return this.bookingService.searchMultiLeg({ from, to, date });
  }

  /** Public: get seat map for a trip */
  @Get('trips/:tripId/seats')
  getTripSeatMap(@Param('tripId') tripId: string) {
    return this.bookingService.getTripSeatMap(tripId);
  }

  /** Public: reviews for a trip (resolved via its driver). PII-masked. */
  @Get('trips/:tripId/reviews')
  @Throttle({ short: { limit: 20, ttl: 10000 } })
  async getTripReviews(@Param('tripId') tripId: string, @Query('take') take?: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { driverId: true } });
    if (!trip) return { reviews: [], averageRating: 0, totalCount: 0 };
    return this.bookingService.getPublicReviewsForDriver(trip.driverId, take ? parseInt(take, 10) : 6);
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

  /** Public: live trip location for a ticket (PNR + email verification) */
  @Get('ticket/:pnr/live')
  @Throttle({ short: { limit: 15, ttl: 10000 } })
  getLiveLocation(@Param('pnr') pnr: string, @Query('email') email: string) {
    return this.bookingService.getTripLiveLocation(pnr, email);
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
    return this.bookingService.cancelBooking(req.user.tenantId, id, { actorId: req.user.id });
  }

  /** Admin: list all tenant bookings with filters */
  @Get('admin/bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listAdmin(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.bookingService.listTenantBookings(tenantId, {
      status,
      from,
      to,
      q,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 25,
    });
  }

  /** Admin: get booking detail */
  @Get('admin/bookings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  detailAdmin(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.getTenantBookingDetail(req.user.tenantId, id);
  }

  /** Admin: cancel booking (optionally issue Iyzico refund) */
  @Post('admin/bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancelAdmin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.bookingService.cancelBooking(tenantId, id, {
      refund: dto.refund,
      actorId: req.user.id,
    });

    // If admin requested refund AND we have a transactionId, call Iyzico
    if (dto.refund && result.paymentTransactionId) {
      const refund = await this.paymentService.refundPayment(
        result.paymentTransactionId,
        result.pricePaid,
      );
      await this.prisma.booking.update({
        where: { id },
        data: {
          refundStatus: refund.success ? 'REFUNDED' : 'FAILED',
          refundedAt: refund.success ? new Date() : null,
        },
      });
      return {
        message: refund.success
          ? `Bilet iptal edildi ve ₺${result.pricePaid} iade edildi.`
          : `Bilet iptal edildi ancak iade başarısız oldu: ${refund.errorMessage}`,
        refund,
      };
    }

    return {
      message: 'Bilet iptal edildi',
      refund: null,
    };
  }
}
