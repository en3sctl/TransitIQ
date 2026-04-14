import { Controller, Get, Post, Body, Query, Param, Request, Headers, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { BookingService } from './booking.service';
import { SearchTripsDto, CreateReservationDto, LockSeatsDto } from './dto/booking.dto';
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
    @Body() body: { refund?: boolean },
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.bookingService.cancelBooking(tenantId, id, {
      refund: body.refund,
    });

    // If admin requested refund AND we have a transactionId, call Iyzico
    if (body.refund && result.paymentTransactionId) {
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
