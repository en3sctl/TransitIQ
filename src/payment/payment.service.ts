import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require('iyzipay');

@Injectable()
export class PaymentService {
  private iyzipay: any;

  constructor(private configService: ConfigService) {
    this.iyzipay = new Iyzipay({
      apiKey: this.configService.get<string>('IYZICO_API_KEY'),
      secretKey: this.configService.get<string>('IYZICO_SECRET_KEY'),
      uri: this.configService.get<string>('IYZICO_BASE_URL'),
    });
  }

  async initializeCheckoutForm(params: {
    price: string;
    buyerName: string;
    buyerSurname: string;
    buyerTc: string;
    buyerEmail: string;
    buyerPhone: string;
  }): Promise<{ checkoutFormContent: string; token: string }> {
    const { price, buyerName, buyerSurname, buyerTc, buyerEmail, buyerPhone } =
      params;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `transit-${Date.now()}`,
      price: price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: `BASKET-${Date.now()}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: 'http://localhost:3000/payment/callback',
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
          price: price,
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
          });
        }
      });
    });
  }

  async retrieveCheckoutForm(token: string): Promise<{ status: string; conversationId: string }> {
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
            });
          }
        },
      );
    });
  }
}
