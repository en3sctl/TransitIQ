import { Controller, Post, Body } from '@nestjs/common';
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
}
