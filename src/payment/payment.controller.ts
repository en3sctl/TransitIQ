import { Controller, Post, Body, Res, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { BookingService } from '../booking/booking.service';
import { Throttle } from '@nestjs/throttler';

@Controller('payment')
export class PaymentController {
  private readonly frontendUrl: string;

  constructor(
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  @Post('initialize')
  @Throttle({ short: { limit: 3, ttl: 10000 } })
  async initializePayment(@Body() dto: InitializePaymentDto) {
    const result = await this.paymentService.initializeCheckoutForm({
      price: dto.price,
      buyerName: dto.buyerName,
      buyerSurname: dto.buyerSurname,
      buyerTc: dto.buyerTc,
      buyerEmail: dto.buyerEmail,
      buyerPhone: dto.buyerPhone,
    });

    // Store booking data keyed by Iyzico token (reliable across callback)
    if (dto.tripId && dto.passengers && dto.passengers.length > 0) {
      await this.paymentService.storePendingBooking(result.token, result.conversationId, {
        tripId: dto.tripId,
        passengers: dto.passengers,
        contactEmail: dto.buyerEmail,
        contactPhone: dto.buyerPhone,
        price: dto.price,
        userId: dto.userId,
        walletAmount: dto.walletAmount,
        promoCodeId: dto.promoCodeId,
      });
      console.log('[Payment Init] Stored pending booking with token:', result.token.substring(0, 20) + '...', '| userId:', dto.userId || 'guest');
    }

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
