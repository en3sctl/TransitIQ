import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommerceService } from './commerce.service';

@ApiTags('Commerce')
@Controller()
export class CommerceController {
  constructor(private readonly service: CommerceService) {}

  // ─── Plans (super-admin CRUD + public list in onboarding) ───

  @Get('super-admin/plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listPlans(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.listPlans();
  }

  @Post('super-admin/plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createPlan(@Request() req: any, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.createPlan(body);
  }

  @Patch('super-admin/plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updatePlan(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.updatePlan(id, body);
  }

  @Delete('super-admin/plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deletePlan(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.deletePlan(id);
  }

  @Post('super-admin/plans/seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  seedPlans(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.seedPlans();
  }

  @Post('super-admin/tenants/:id/assign-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  assignPlan(@Request() req: any, @Param('id') tenantId: string, @Body() body: { planId: string | null }) {
    this.assertSuper(req.user);
    return this.service.assignPlan(tenantId, body.planId);
  }

  // ─── Invoices ───

  @Get('admin/invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myInvoices(@Request() req: any) {
    return this.service.listInvoicesForTenant(req.user.tenantId);
  }

  @Get('super-admin/invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  allInvoices(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertSuper(req.user);
    return this.service.listAllInvoices({
      status, tenantId,
      take: take ? parseInt(take, 10) : 100,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Post('super-admin/invoices/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generate(@Request() req: any, @Body() body: { tenantId: string; periodStart: string; periodEnd: string }) {
    this.assertSuper(req.user);
    return this.service.generateInvoice(body.tenantId, new Date(body.periodStart), new Date(body.periodEnd));
  }

  @Patch('super-admin/invoices/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    this.assertSuper(req.user);
    return this.service.updateInvoiceStatus(id, body.status);
  }

  // ─── Risk Scoring ───

  @Get('super-admin/risk-report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  riskReport(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.getRiskReport();
  }

  @Post('super-admin/risk-scores/recompute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  recomputeScores(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.computeAllRiskScores();
  }

  private assertSuper(user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Sadece süper admin');
  }
}
