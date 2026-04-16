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
  }): Promise<{ checkoutFormContent: string; token: string; conversationId: string }> {
    const { price, buyerName, buyerSurname, buyerTc, buyerEmail, buyerPhone } = params;

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
      this.iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
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

  async retrieveCheckoutForm(token: string): Promise<{ status: string; conversationId: string; paymentId: string; itemTransactions?: any[] }> {
    return new Promise((resolve, reject) => {
      this.iyzipay.checkoutForm.retrieve(
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
  async refundPayment(paymentTransactionId: string, price: string): Promise<{ success: boolean; refundId?: string; errorMessage?: string }> {
    return new Promise((resolve) => {
      this.iyzipay.refund.create(
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
  async getPaymentDetails(paymentId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.iyzipay.payment.retrieve(
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
