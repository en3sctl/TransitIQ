import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  getRevenue(@Request() req: any) {
    return this.analyticsService.getRevenueStats(req.user.tenantId);
  }

  @Get('occupancy')
  getOccupancy(@Request() req: any) {
    return this.analyticsService.getOccupancyStats(req.user.tenantId);
  }

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.analyticsService.getDashboard(req.user.tenantId);
  }
}
