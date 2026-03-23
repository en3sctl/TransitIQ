import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BookingModule } from '../booking/booking.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [BookingModule, CommonModule],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
