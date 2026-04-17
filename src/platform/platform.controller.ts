import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { PlatformService } from './platform.service';

@ApiTags('Platform')
@Controller()
export class PlatformController {
  constructor(private readonly service: PlatformService) {}

  // ─── Overview ───

  @Get('super-admin/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  overview(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.getOverview();
  }

  // ─── Approvals ───

  @Get('super-admin/tenants/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  pendingApprovals(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.listPendingApprovals();
  }

  @Post('super-admin/tenants/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  approve(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.approveTenant(id, req.user.id);
  }

  @Post('super-admin/tenants/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reject(@Request() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    this.assertSuper(req.user);
    return this.service.rejectTenant(id, body?.reason || '', req.user.id);
  }

  // ─── Impersonation ───

  @Post('super-admin/tenants/:id/impersonate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  impersonate(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.impersonateTenantAdmin(id, req.user.id);
  }

  // ─── Booking Lookup ───

  @Get('super-admin/bookings/lookup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  bookingLookup(@Request() req: any, @Query('q') q: string) {
    this.assertSuper(req.user);
    return this.service.lookupBookings(q || '');
  }

  // ─── Audit Log ───

  @Get('super-admin/audit-log')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  auditLog(
    @Request() req: any,
    @Query('action') action?: string,
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertSuper(req.user);
    return this.service.getAuditLog({
      action, tenantId, userId,
      take: take ? parseInt(take, 10) : 100,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  // ─── Announcements (super admin CRUD) ───

  @Get('super-admin/announcements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listAnnouncements(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.listAnnouncements();
  }

  @Post('super-admin/announcements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createAnnouncement(@Request() req: any, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.createAnnouncement(req.user.id, body);
  }

  @Patch('super-admin/announcements/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateAnnouncement(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.updateAnnouncement(id, body);
  }

  @Delete('super-admin/announcements/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteAnnouncement(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.deleteAnnouncement(id);
  }

  /** Public endpoint: active announcements for the current viewer. */
  @Get('announcements/active')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 30, ttl: 10000 } })
  activeAnnouncements(@Request() req: any, @Query('audience') audience?: string) {
    // If authed, infer audience from role; otherwise use query hint or PASSENGERS default
    let eff = 'PASSENGERS';
    if (req.user) {
      if (req.user.role === 'COMPANY_ADMIN' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'OPERATOR') eff = 'COMPANY_ADMINS';
      else if (req.user.role === 'DRIVER') eff = 'DRIVERS';
      else eff = 'PASSENGERS';
    } else if (audience && ['COMPANY_ADMINS', 'PASSENGERS', 'DRIVERS'].includes(audience)) {
      eff = audience;
    }
    return this.service.listActiveForAudience(eff);
  }

  // ─── Users ───

  @Get('super-admin/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  users(
    @Request() req: any,
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('tenantId') tenantId?: string,
    @Query('suspended') suspended?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertSuper(req.user);
    return this.service.listUsers({
      q, role, tenantId,
      suspended: suspended === 'true' ? true : suspended === 'false' ? false : undefined,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Post('super-admin/users/:id/suspend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  suspendUser(@Request() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    this.assertSuper(req.user);
    return this.service.suspendUser(id, body?.reason || '', req.user.id);
  }

  @Post('super-admin/users/:id/unsuspend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unsuspendUser(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.unsuspendUser(id, req.user.id);
  }

  @Post('super-admin/users/:id/reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  resetPassword(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.resetUserPassword(id, req.user.id);
  }

  // ─── Guards ───

  private assertSuper(user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Sadece süper admin');
    }
  }
}
