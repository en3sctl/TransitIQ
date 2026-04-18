import { Module } from '@nestjs/common';
import { DriverOpsService } from './driver-ops.service';
import { DriverOpsController } from './driver-ops.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [DriverOpsService],
  controllers: [DriverOpsController],
})
export class DriverOpsModule {}
