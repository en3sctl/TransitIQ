import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactMessageDto } from './contact.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a contact form message' })
  async submit(@Body() dto: ContactMessageDto) {
    const result = await this.notifications.sendContactMessage(dto);
    if (!result.ok) {
      throw new HttpException('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { ok: true, message: 'Mesajınız ulaştı. En kısa sürede geri dönüş yapacağız.' };
  }
}
