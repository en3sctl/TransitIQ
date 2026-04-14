import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [TicketsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
