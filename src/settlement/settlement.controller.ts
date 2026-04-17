import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettlementService } from './settlement.service';

@ApiTags('Settlement')
@Controller()
export class SettlementController {
  constructor(private readonly service: SettlementService) {}

  // ─── Company admin: own tenant ───

  @Get('admin/settlements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  list(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    this.assertAdmin(req.user);
    return this.service.listForTenant(req.user.tenantId, {
      status, from, to,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
  }

  @Get('admin/settlements/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  summary(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.assertAdmin(req.user);
    return this.service.getTenantSummary(req.user.tenantId, { from, to });
  }

  // ─── Super-admin ───

  @Get('super-admin/settlements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  superList(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    this.assertSuper(req.user);
    return this.service.superAdminList({
      status, tenantId, from, to,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 100,
    });
  }

  @Patch('super-admin/settlements/:id/settle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  settle(@Request() req: any, @Param('id') id: string, @Body() body: { notes?: string }) {
    this.assertSuper(req.user);
    return this.service.markSettled(id, body?.notes);
  }

  @Post('super-admin/settlements/bulk-settle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  bulkSettle(@Request() req: any, @Body() body: { ids: string[] }) {
    this.assertSuper(req.user);
    return this.service.bulkMarkSettled(body.ids);
  }

  @Post('super-admin/settlements/backfill')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  backfill(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.backfill();
  }

  // ─── Guards ───

  private assertAdmin(user: any) {
    if (!user || !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Yetkisiz');
    }
  }
  private assertSuper(user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Sadece süper admin');
    }
  }
}
