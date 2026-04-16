import { Controller, Post, Body, Res, Req, Inject, forwardRef, BadRequestException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { BookingService } from '../booking/booking.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { PromoService } from '../promo/promo.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('payment')
export class PaymentController {
  private readonly frontendUrl: string;

  constructor(
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly promoService: PromoService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  @Post('initialize')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 3, ttl: 10000 } })
  async initializePayment(@Req() req: any, @Body() dto: InitializePaymentDto) {
    // SECURITY: ignore client-supplied userId and price. Trust only JWT + server-side calc.
    const authUserId: string | undefined = req.user?.id;

    if (!dto.tripId || !dto.passengers || dto.passengers.length === 0) {
      throw new BadRequestException('Sefer ve yolcu bilgileri eksik');
    }

    // 1) Fetch trip + compute base price server-side
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      include: { route: true },
    });
    if (!trip) throw new BadRequestException('Sefer bulunamadı');
    if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
      throw new BadRequestException('Bu sefere bilet alınamaz');
    }

    const seatsCount = dto.passengers.length;
    const tripGross = Math.round(Number(trip.route.basePrice) * seatsCount * 100) / 100;

    // 2) Apply promo code (server-side validation)
    let promoDiscount = 0;
    let validatedPromoCodeId: string | undefined;
    if (dto.promoCodeId && authUserId) {
      try {
        const promo = await this.prisma.promoCode.findUnique({ where: { id: dto.promoCodeId } });
        if (promo) {
          const applied = await this.promoService.applyCode(promo.code, tripGross, authUserId);
          promoDiscount = applied.discount;
          validatedPromoCodeId = applied.promoCodeId;
        }
      } catch {
        // Invalid promo → silently ignore (don't leak why)
      }
    }

    // 3) Apply wallet (server-side cap to actual balance)
    let walletDebit = 0;
    if (dto.walletAmount && dto.walletAmount > 0 && authUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: authUserId },
        select: { walletBalance: true },
      });
      if (user) {
        const available = Number(user.walletBalance);
        const requested = Number(dto.walletAmount);
        walletDebit = Math.min(available, Math.max(0, requested), tripGross - promoDiscount);
        walletDebit = Math.round(walletDebit * 100) / 100;
      }
    }

    // 4) Final price to charge via Iyzico
    const finalPrice = Math.max(0, Math.round((tripGross - promoDiscount - walletDebit) * 100) / 100);
    if (finalPrice <= 0) {
      throw new BadRequestException('Ödenecek tutar 0 veya negatif olamaz. Kart ödemesi gerekli.');
    }

    const result = await this.paymentService.initializeCheckoutForm({
      price: String(finalPrice),
      buyerName: dto.buyerName,
      buyerSurname: dto.buyerSurname,
      buyerTc: dto.buyerTc,
      buyerEmail: dto.buyerEmail,
      buyerPhone: dto.buyerPhone,
    });

    await this.paymentService.storePendingBooking(result.token, result.conversationId, {
      tripId: dto.tripId,
      passengers: dto.passengers,
      contactEmail: dto.buyerEmail,
      contactPhone: dto.buyerPhone,
      price: String(finalPrice),
      userId: authUserId,
      walletAmount: walletDebit,
      promoCodeId: validatedPromoCodeId,
    });

    return { checkoutFormContent: result.checkoutFormContent };
  }

  @Post('callback')
  async handleCallback(
    @Body() body: { token: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.paymentService.retrieveCheckoutForm(body.token);
      console.log('[Payment Callback] Status:', result.status);

      if (result.status === 'success') {
        // Look up pending booking by the SAME token used in callback
        const pendingData = await this.paymentService.getPendingBookingByToken(body.token);
        console.log('[Payment Callback] PendingData found:', !!pendingData);

        if (pendingData) {
          try {
            // Extract paymentTransactionId from first basket item (refund requires per-item ID)
            const firstItemTx = result.itemTransactions?.[0];
            const paymentTransactionId = firstItemTx?.paymentTransactionId || undefined;

            const bookingResult = await this.bookingService.createReservation({
              tripId: pendingData.tripId,
              passengers: pendingData.passengers,
              contactEmail: pendingData.contactEmail,
              contactPhone: pendingData.contactPhone,
              userId: pendingData.userId,
              paymentId: result.paymentId,
              paymentTransactionId,
            });

            // Process wallet debit, promo usage, loyalty cashback
            const firstBookingId = (bookingResult as any).bookings?.[0]?.id;
            if (firstBookingId) {
              await this.paymentService.processPostBookingLedger({
                userId: pendingData.userId,
                bookingId: firstBookingId,
                totalPrice: Number(pendingData.price),
                walletAmount: pendingData.walletAmount,
                promoCodeId: pendingData.promoCodeId,
              });
            }

            await this.paymentService.removePendingBookingByToken(body.token);

            const pnrs = bookingResult.pnrCodes;
            console.log('[Payment Callback] Booking created! PNRs:', pnrs.join(', '));
            const pnrParam = pnrs.map(p => encodeURIComponent(p)).join(',');
            return res.redirect(302, `${this.frontendUrl}/success?pnr=${pnrParam}&total=${bookingResult.totalPaid}`);
          } catch (bookingError) {
            console.error('[Payment Callback] Booking creation failed:', bookingError);
            return res.redirect(302, `${this.frontendUrl}/success?error=booking`);
          }
        }

        // No pending data - legacy fallback
        console.log('[Payment Callback] No pending data found for token');
        const pnr = 'TX-' + Math.floor(10000 + Math.random() * 90000);
        return res.redirect(302, `${this.frontendUrl}/success?pnr=${encodeURIComponent(pnr)}`);
      }

      return res.redirect(302, `${this.frontendUrl}/checkout?paymentStatus=failed`);
    } catch (err) {
      console.error('[Payment Callback] Error:', err);
      return res.redirect(302, `${this.frontendUrl}/checkout?paymentStatus=failed`);
    }
  }
}
