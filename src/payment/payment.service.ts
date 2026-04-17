import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require('iyzipay');

export interface PendingBookingData {
  tripId: string;
  passengers: {
    tcKimlik: string;
    firstName: string;
    lastName: string;
    seatId: string;
  }[];
  contactEmail: string;
  contactPhone: string;
  price: string;
  userId?: string;
  walletAmount?: number;
  promoCodeId?: string;
}

@Injectable()
export class PaymentService {
  private iyzipay: any;
  /** Cached per-tenant Iyzipay clients (keyed by tenantId). */
  private tenantClients = new Map<string, any>();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.iyzipay = new Iyzipay({
      apiKey: this.configService.get<string>('IYZICO_API_KEY'),
      secretKey: this.configService.get<string>('IYZICO_SECRET_KEY'),
      uri: this.configService.get<string>('IYZICO_BASE_URL'),
    });
  }

  /**
   * Returns the correct Iyzipay client for a tenant. If the tenant runs in
   * OWN mode and has valid credentials, uses their account; otherwise falls
   * back to the platform client (configured via env).
   */
  private async getClientForTenant(tenantId?: string): Promise<any> {
    if (!tenantId) return this.iyzipay;
    if (this.tenantClients.has(tenantId)) return this.tenantClients.get(tenantId);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { iyzicoMode: true, iyzicoApiKey: true, iyzicoSecretKey: true },
    });

    if (tenant?.iyzicoMode === 'OWN' && tenant.iyzicoApiKey && tenant.iyzicoSecretKey) {
      const client = new Iyzipay({
        apiKey: tenant.iyzicoApiKey,
        secretKey: tenant.iyzicoSecretKey,
        uri: this.configService.get<string>('IYZICO_BASE_URL'),
      });
      this.tenantClients.set(tenantId, client);
      return client;
    }

    // Platform mode — use shared client
    return this.iyzipay;
  }

  /** Invalidate cached client (call after tenant updates keys). */
  invalidateTenantClient(tenantId: string) {
    this.tenantClients.delete(tenantId);
  }

  /**
   * Record settlement (platform commission split) once a booking is confirmed.
   * Idempotent — unique by bookingId.
   */
  async recordSettlement(bookingId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true, tenantId: true, pricePaid: true, status: true,
          tenant: { select: { commissionRate: true } },
        },
      });
      if (!booking || booking.status !== 'CONFIRMED') return;

      const gross = Number(booking.pricePaid);
      const rate = Number(booking.tenant.commissionRate) || 0;
      const commission = Math.round(gross * rate * 100) / 100;
      const net = Math.round((gross - commission) * 100) / 100;

      await this.prisma.settlement.upsert({
        where: { bookingId: booking.id },
        create: {
          tenantId: booking.tenantId,
          bookingId: booking.id,
          grossAmount: gross,
          commissionAmount: commission,
          netAmount: net,
          commissionRate: rate,
          status: 'PENDING',
        },
        update: {}, // no-op on duplicate
      });
    } catch (err) {
      console.error('[recordSettlement] failed:', err);
    }
  }

  async storePendingBooking(token: string, conversationId: string, data: PendingBookingData) {
    await this.prisma.pendingPayment.create({
      data: {
        paymentToken: token,
        conversationId,
        tripId: data.tripId,
        passengersJson: JSON.stringify(data.passengers),
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        price: data.price,
        userId: data.userId || null,
        walletAmount: data.walletAmount ?? null,
        promoCodeId: data.promoCodeId ?? null,
      },
    });
  }

  async getPendingBookingByToken(token: string): Promise<PendingBookingData | null> {
    const record = await this.prisma.pendingPayment.findUnique({
      where: { paymentToken: token },
    });

    if (!record) return null;

    return {
      tripId: record.tripId,
      passengers: JSON.parse(record.passengersJson),
      contactEmail: record.contactEmail,
      contactPhone: record.contactPhone,
      price: record.price,
      userId: (record as any).userId || undefined,
      walletAmount: record.walletAmount ? Number(record.walletAmount) : undefined,
      promoCodeId: record.promoCodeId ?? undefined,
    };
  }

  /**
   * Post-booking ledger: debits wallet, records promo code use,
   * credits loyalty cashback (2% of card-paid portion).
   * Safe to call without userId — no-op for guest bookings.
   */
  async processPostBookingLedger(params: {
    userId?: string;
    bookingId: string;
    totalPrice: number; // final amount user paid (after promo)
    walletAmount?: number;
    promoCodeId?: string;
  }) {
    const { userId, bookingId, totalPrice, walletAmount, promoCodeId } = params;

    if (!userId) return; // guest checkout — no wallet/loyalty

    try {
      // 1) Debit wallet if used
      if (walletAmount && walletAmount > 0) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { walletBalance: true },
        });
        if (user) {
          const available = Number(user.walletBalance);
          const debit = Math.min(available, walletAmount);
          if (debit > 0) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { walletBalance: { decrement: debit } },
            });
            await this.prisma.walletTransaction.create({
              data: {
                userId, amount: -debit, type: 'PAYMENT',
                reason: 'Bilet ödemesinde cüzdan kullanımı',
                bookingId,
              },
            });
          }
        }
      }

      // 2) Record promo code application
      if (promoCodeId) {
        const promo = await this.prisma.promoCode.findUnique({ where: { id: promoCodeId } });
        if (promo) {
          await this.prisma.promoCode.update({
            where: { id: promoCodeId },
            data: { usedCount: { increment: 1 } },
          });
          // Calculate discount amount for record
          const cardAmount = totalPrice - (walletAmount || 0);
          const discount = promo.discountType === 'PERCENT'
            ? Math.round(totalPrice * Number(promo.discountValue) / 100 * 100) / 100
            : Math.min(Number(promo.discountValue), totalPrice);
          await this.prisma.promoCodeApplication.create({
            data: { promoCodeId, bookingId, userId, discountApplied: discount },
          });
        }
      }

      // 3) Loyalty cashback — 2% of card-paid amount (not wallet or promo portion)
      const cardPaid = Math.max(0, totalPrice - (walletAmount || 0));
      if (cardPaid > 0) {
        const cashback = Math.round(cardPaid * 0.02 * 100) / 100;
        if (cashback > 0) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: cashback } },
          });
          await this.prisma.walletTransaction.create({
            data: {
              userId, amount: cashback, type: 'PROMOTION',
              reason: 'Sadakat iadesi (%2 cashback)',
              bookingId,
            },
          });
        }
      }
    } catch (err) {
      console.error('[Post-booking ledger] Failed:', err);
      // don't throw — booking already succeeded, ledger is best-effort
    }
  }

  async removePendingBookingByToken(token: string) {
    await this.prisma.pendingPayment.delete({
      where: { paymentToken: token },
    }).catch(() => {});
  }

  async initializeCheckoutForm(params: {
    price: string;
    buyerName: string;
    buyerSurname: string;
    buyerTc: string;
    buyerEmail: string;
    buyerPhone: string;
    tenantId?: string;
  }): Promise<{ checkoutFormContent: string; token: string; conversationId: string }> {
    const { price, buyerName, buyerSurname, buyerTc, buyerEmail, buyerPhone, tenantId } = params;
    const client = await this.getClientForTenant(tenantId);

    const conversationId = `transit-${Date.now()}`;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: `BASKET-${Date.now()}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${this.configService.get<string>('BACKEND_URL', 'http://localhost:3000')}/payment/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: `BUYER-${Date.now()}`,
        name: buyerName,
        surname: buyerSurname,
        gsmNumber: buyerPhone,
        email: buyerEmail,
        identityNumber: buyerTc,
        lastLoginDate: new Date().toISOString().split('T')[0] + ' 00:00:00',
        registrationDate: new Date().toISOString().split('T')[0] + ' 00:00:00',
        registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        ip: '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34732',
      },
      shippingAddress: {
        contactName: `${buyerName} ${buyerSurname}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34732',
      },
      billingAddress: {
        contactName: `${buyerName} ${buyerSurname}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34732',
      },
      basketItems: [
        {
          id: `TICKET-${Date.now()}`,
          name: 'Otobüs Bileti',
          category1: 'Ulaşım',
          category2: 'Şehirlerarası',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price,
        },
      ],
    };

    return new Promise((resolve, reject) => {
      client.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            checkoutFormContent: result.checkoutFormContent,
            token: result.token,
            conversationId,
          });
        }
      });
    });
  }

  async retrieveCheckoutForm(token: string, tenantId?: string): Promise<{ status: string; conversationId: string; paymentId: string; itemTransactions?: any[] }> {
    const client = await this.getClientForTenant(tenantId);
    return new Promise((resolve, reject) => {
      client.checkoutForm.retrieve(
        { locale: 'tr', token },
        (err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              status: result.status,
              conversationId: result.conversationId || '',
              paymentId: result.paymentId || '',
              itemTransactions: result.itemTransactions,
            });
          }
        },
      );
    });
  }

  /**
   * Refund a payment via Iyzico using the paymentTransactionId.
   * Note: refund requires `paymentTransactionId` (per-item), NOT the top-level `paymentId`.
   */
  async refundPayment(paymentTransactionId: string, price: string, tenantId?: string): Promise<{ success: boolean; refundId?: string; errorMessage?: string }> {
    const client = await this.getClientForTenant(tenantId);
    return new Promise((resolve) => {
      client.refund.create(
        {
          locale: 'tr',
          conversationId: `refund-${Date.now()}`,
          paymentTransactionId,
          price,
          currency: 'TRY',
          ip: '85.34.78.112',
        },
        (err: any, result: any) => {
          if (err) {
            resolve({ success: false, errorMessage: err.message || 'Iyzico refund error' });
            return;
          }
          if (result.status === 'success') {
            resolve({ success: true, refundId: result.paymentId });
          } else {
            resolve({ success: false, errorMessage: result.errorMessage || 'Refund rejected' });
          }
        },
      );
    });
  }

  /**
   * Retrieve full payment details via Iyzico to extract paymentTransactionId for each basket item.
   */
  async getPaymentDetails(paymentId: string, tenantId?: string): Promise<any> {
    const client = await this.getClientForTenant(tenantId);
    return new Promise((resolve, reject) => {
      client.payment.retrieve(
        {
          locale: 'tr',
          conversationId: `lookup-${Date.now()}`,
          paymentId,
        },
        (err: any, result: any) => {
          if (err) return reject(err);
          resolve(result);
        },
      );
    });
  }
}
