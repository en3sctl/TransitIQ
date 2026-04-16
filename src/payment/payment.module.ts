import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BookingModule } from '../booking/booking.module';
import { CommonModule } from '../common/common.module';
import { PromoModule } from '../promo/promo.module';

@Module({
  imports: [forwardRef(() => BookingModule), CommonModule, PromoModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
