import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CommonModule } from '../common/common.module';
import { PaymentModule } from '../payment/payment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DriverOpsModule } from '../driver-ops/driver-ops.module';

@Module({
  imports: [CommonModule, PaymentModule, NotificationsModule, DriverOpsModule],
  providers: [TasksService],
})
export class TasksModule {}
