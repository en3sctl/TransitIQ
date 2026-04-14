import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ContactController } from './contact.controller';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [TicketsModule],
  providers: [NotificationsService],
  controllers: [ContactController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
