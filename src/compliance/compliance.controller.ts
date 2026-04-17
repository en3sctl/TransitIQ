import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance')
@Controller()
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  // ─── Support tickets ───

  /** Public: anyone (guest or authed) can open a ticket */
  @Post('support/tickets')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  createTicket(@Request() req: any, @Body() body: any) {
    return this.service.createTicket({
      ...body,
      userId: req.user?.id,
      tenantId: req.user?.role === 'COMPANY_ADMIN' ? req.user.tenantId : undefined,
    });
  }

  @Get('super-admin/tickets')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  listTickets(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('tenantId') tenantId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertSuper(req.user);
    return this.service.listTickets({
      status, priority, tenantId,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get('super-admin/tickets/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  getTicket(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.getTicket(id);
  }

  @Post('super-admin/tickets/:id/reply')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  reply(@Request() req: any, @Param('id') id: string, @Body() body: { body: string; internal?: boolean }) {
    this.assertSuper(req.user);
    return this.service.replyTicket(id, req.user.id, req.user.name || 'Destek', body.body, body.internal);
  }

  @Patch('super-admin/tickets/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status?: string; priority?: string; assignedTo?: string }) {
    this.assertSuper(req.user);
    return this.service.updateTicketStatus(id, body.status!, body.priority, body.assignedTo);
  }

  // ─── Terms versions ───

  @Get('super-admin/terms')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  listTerms(@Request() req: any, @Query('kind') kind?: string) {
    this.assertSuper(req.user);
    return this.service.listTermsVersions(kind);
  }

  @Post('super-admin/terms')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  publishTerms(@Request() req: any, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.publishTermsVersion(body);
  }

  @Get('terms/current')
  @Throttle({ short: { limit: 30, ttl: 10000 } })
  currentTerms(@Query('kind') kind: string = 'TERMS') {
    return this.service.getCurrentTerms(kind);
  }

  // ─── Consent log ───

  @Post('consent')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  recordConsent(@Request() req: any, @Body() body: { kind: string; version?: string; granted: boolean; email?: string }) {
    return this.service.recordConsent({
      ...body,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('super-admin/consent-logs')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  listConsent(@Request() req: any, @Query('email') email?: string, @Query('userId') userId?: string) {
    this.assertSuper(req.user);
    return this.service.listConsentForUser({ email, userId });
  }

  private assertSuper(user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') throw new ForbiddenException();
  }
}
