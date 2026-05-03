import { Controller, Post, Body, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { ChatDto, SuggestPriceDto } from './dto/ai.dto';

@ApiTags('AI Features')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** Public chatbot for passenger-facing assistant widget. */
  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto.message);
  }

  @Post('suggest-price')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async suggestPrice(
    @Request() req: any,
    @Body() dto: SuggestPriceDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.aiService.suggestTicketPrice(tenantId, dto.routeId, dto.vehicleId);
  }

  @Get('optimize-route')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async optimizeRoute(
    @Request() req: any,
    @Query('tripId') tripId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.aiService.optimizeRouteForPickups(tenantId, tripId);
  }
}
