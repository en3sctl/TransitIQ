import { Controller, Post, Body, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('payment')
export class PaymentController {
  private readonly frontendUrl: string;

  constructor(
    private readonly paymentService: PaymentService,
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

    return { checkoutFormContent: result.checkoutFormContent };
  }

  @Post('callback')
  async handleCallback(
    @Body() body: { token: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.paymentService.retrieveCheckoutForm(body.token);

      if (result.status === 'success') {
        let pnr = '';
        if (result.conversationId && result.conversationId.startsWith('pnr-')) {
          pnr = result.conversationId.replace('pnr-', '');
        }
        if (!pnr) {
          pnr = 'TX-' + Math.floor(10000 + Math.random() * 90000);
        }

        return res.redirect(302, `${this.frontendUrl}/success?pnr=${encodeURIComponent(pnr)}`);
      }

      return res.redirect(302, `${this.frontendUrl}/checkout?paymentStatus=failed`);
    } catch {
      return res.redirect(302, `${this.frontendUrl}/checkout?paymentStatus=failed`);
    }
  }
}
