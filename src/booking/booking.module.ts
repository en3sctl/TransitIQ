import { Module, forwardRef } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { SeatsGateway } from './seats.gateway';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentModule } from '../payment/payment.module';
import { PassengerFeaturesModule } from '../passenger-features/passenger-features.module';

@Module({
  imports: [CommonModule, NotificationsModule, forwardRef(() => PaymentModule), forwardRef(() => PassengerFeaturesModule)],
  providers: [BookingService, SeatsGateway],
  controllers: [BookingController],
  exports: [BookingService, SeatsGateway],
})
export class BookingModule {}
