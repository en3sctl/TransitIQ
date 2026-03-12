import { Controller, Post, Body, Get, Query, Request } from '@nestjs/common';
import { AiService } from './ai.service';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('AI Features')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-price')
  async suggestPrice(
    @Request() req: any,
    @Body() body: { routeId: string; vehicleId: string },
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.aiService.suggestTicketPrice(tenantId, body.routeId, body.vehicleId);
  }

  @Get('optimize-route')
  async optimizeRoute(
    @Request() req: any,
    @Query('tripId') tripId: string,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.aiService.optimizeRouteForPickups(tenantId, tripId);
  }
}
