import { Module, forwardRef } from '@nestjs/common';
import { WaitingListService } from './waiting-list.service';
import { WaitingListController } from './waiting-list.controller';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, NotificationsModule, forwardRef(() => AuthModule)],
  providers: [WaitingListService],
  controllers: [WaitingListController],
  exports: [WaitingListService],
})
export class WaitingListModule {}
