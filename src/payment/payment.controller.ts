import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
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
        // Try to extract PNR from conversationId, fallback to generated one
        let pnr = '';
        if (result.conversationId && result.conversationId.startsWith('pnr-')) {
          pnr = result.conversationId.replace('pnr-', '');
        }
        if (!pnr) {
          pnr = 'TX-' + Math.floor(10000 + Math.random() * 90000);
        }

        return res.redirect(302, `http://localhost:3001/success?pnr=${encodeURIComponent(pnr)}`);
      }

      return res.redirect(302, 'http://localhost:3001/checkout?paymentStatus=failed');
    } catch {
      return res.redirect(302, 'http://localhost:3001/checkout?paymentStatus=failed');
    }
  }
}
