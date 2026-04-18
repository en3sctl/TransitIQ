import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WaitingListService } from './waiting-list.service';
import type { JoinWaitingListDto } from './waiting-list.service';

@ApiTags('WaitingList')
@Controller()
export class WaitingListController {
  constructor(private readonly service: WaitingListService) {}

  /** Public: join (optional auth — if logged in, userId is attached) */
  @Post('waiting-list')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  join(@Request() req: any, @Body() dto: JoinWaitingListDto) {
    return this.service.join(dto, req.user?.id);
  }

  @Get('waiting-list/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myEntries(@Request() req: any) {
    return this.service.myEntries(req.user.id);
  }

  @Delete('waiting-list/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.service.cancelEntry(req.user.id, id);
  }

  @Get('admin/waiting-list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  adminList(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('tripId') tripId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    // Sadece firma admin veya super admin — PASSENGER/DRIVER erişemez
    if (!req.user || !['COMPANY_ADMIN', 'SUPER_ADMIN', 'OPERATOR'].includes(req.user.role)) {
      throw new ForbiddenException('Bu işlem için firma admin yetkisi gerekli');
    }
    return this.service.adminList(req.user.tenantId, {
      status, tripId,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }
}
