import { Controller, Post, Body, Res, Req, Inject, forwardRef, BadRequestException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { BookingService } from '../booking/booking.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { PromoService } from '../promo/promo.service';
import { AuditService } from '../common/audit/audit.service';
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
    private readonly audit: AuditService,
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
      tenantId: trip.tenantId,  // routes payment to tenant's Iyzico account if in OWN mode
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
      // Resolve tenantId from pending record so we can retrieve with the same Iyzico client
      // that initialized the checkout form.
      const pendingData = await this.paymentService.getPendingBookingByToken(body.token);
      let tenantId: string | undefined;
      if (pendingData?.tripId) {
        const trip = await this.prisma.trip.findUnique({
          where: { id: pendingData.tripId },
          select: { tenantId: true },
        });
        tenantId = trip?.tenantId;
      }

      const result = await this.paymentService.retrieveCheckoutForm(body.token, tenantId);
      console.log('[Payment Callback] Status:', result.status);

      if (result.status === 'success') {
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

            // Platform komisyon kaydı — hata sessizce yutulmamalı
            // çünkü bu olmadan fatura boş çıkar. Booking başarılı olmuşsa settlement de düşmeli.
            for (const b of (bookingResult as any).bookings || []) {
              try {
                await this.paymentService.recordSettlement(b.id);
              } catch (err: any) {
                console.error(`[Payment Callback] recordSettlement failed for booking ${b.id}:`, err.message || err);
                if (tenantId) {
                  await this.audit.log({
                    tenantId,
                    userId: pendingData.userId || null,
                    action: 'PAYMENT_SETTLEMENT_FAILED',
                    entityType: 'BOOKING',
                    entityId: b.id,
                    newValues: {
                      paymentId: result.paymentId,
                      error: err?.message || String(err),
                      hint: 'Super-admin: run /super-admin/settlements/backfill',
                    },
                  });
                }
              }
            }

            await this.paymentService.removePendingBookingByToken(body.token);

            const pnrs = bookingResult.pnrCodes;
            console.log('[Payment Callback] Booking created! PNRs:', pnrs.join(', '));
            const pnrParam = pnrs.map(p => encodeURIComponent(p)).join(',');
            return res.redirect(302, `${this.frontendUrl}/success?pnr=${pnrParam}&total=${bookingResult.totalPaid}`);
          } catch (bookingError: any) {
            console.error('[Payment Callback] Booking creation failed:', bookingError);
            if (tenantId) {
              await this.audit.log({
                tenantId,
                userId: pendingData.userId || null,
                action: 'PAYMENT_BOOKING_FAILED',
                entityType: 'PAYMENT',
                entityId: result.paymentId || body.token,
                newValues: {
                  tripId: pendingData.tripId,
                  price: pendingData.price,
                  error: bookingError?.message || String(bookingError),
                },
              });
            }
            return res.redirect(302, `${this.frontendUrl}/success?error=booking`);
          }
        }

        // No pending data - başarılı ödeme ama context yok. Bir yerde pending kayıp olmuş.
        console.log('[Payment Callback] No pending data found for token');
        if (tenantId) {
          await this.audit.log({
            tenantId,
            action: 'PAYMENT_CALLBACK_ORPHAN',
            entityType: 'PAYMENT',
            entityId: body.token,
            newValues: {
              paymentId: result.paymentId,
              hint: 'Success callback received without matching pending booking — audit for reconciliation',
            },
          });
        }
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
