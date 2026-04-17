import { Controller, ForbiddenException, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminSearchService } from './admin-search.service';

@ApiTags('AdminSearch')
@Controller()
export class AdminSearchController {
  constructor(private readonly service: AdminSearchService) {}

  @Get('admin/search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 30, ttl: 10000 } })
  search(@Request() req: any, @Query('q') q: string) {
    if (!req.user || !['COMPANY_ADMIN', 'SUPER_ADMIN', 'OPERATOR'].includes(req.user.role)) {
      throw new ForbiddenException('Yetkisiz');
    }
    return this.service.search(req.user.tenantId, req.user.role, q || '');
  }
}
