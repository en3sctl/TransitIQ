import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DevopsService } from './devops.service';

@ApiTags('DevOps')
@Controller()
export class DevopsController {
  constructor(private readonly service: DevopsService) {}

  // ─── Email templates (super-admin) ───

  @Get('super-admin/email-templates')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  listEmailTemplates(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.listEmailTemplates();
  }

  @Get('super-admin/email-templates/:key')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  getEmailTemplate(@Request() req: any, @Param('key') key: string) {
    this.assertSuper(req.user);
    return this.service.getEmailTemplate(key);
  }

  @Post('super-admin/email-templates/:key')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  upsertEmailTemplate(@Request() req: any, @Param('key') key: string, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.upsertEmailTemplate(key, { ...body, updatedBy: req.user.id });
  }

  @Delete('super-admin/email-templates/:key')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  deleteEmailTemplate(@Request() req: any, @Param('key') key: string) {
    this.assertSuper(req.user);
    return this.service.deleteEmailTemplate(key);
  }

  @Post('super-admin/email-templates/seed')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  seedEmailTemplates(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.seedEmailTemplates();
  }

  // ─── Feature flags ───

  @Get('super-admin/feature-flags')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  listFlags(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.listFlags();
  }

  @Post('super-admin/feature-flags/:key')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  upsertFlag(@Request() req: any, @Param('key') key: string, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.upsertFlag(key, body);
  }

  @Delete('super-admin/feature-flags/:key')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  deleteFlag(@Request() req: any, @Param('key') key: string) {
    this.assertSuper(req.user);
    return this.service.deleteFlag(key);
  }

  /** Public — frontend calls this to know which flags are on. */
  @Get('feature-flags/resolve')
  @Throttle({ short: { limit: 60, ttl: 10000 } })
  resolveFlags(@Query('tenantId') tenantId?: string) {
    return this.service.resolveFlags(tenantId);
  }

  // ─── API Keys (company admin) ───

  @Get('admin/api-keys')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  listApiKeys(@Request() req: any) {
    this.assertCompanyAdmin(req.user);
    return this.service.listApiKeys(req.user.tenantId);
  }

  @Post('admin/api-keys')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  createApiKey(@Request() req: any, @Body() body: any) {
    this.assertCompanyAdmin(req.user);
    return this.service.createApiKey(req.user.tenantId, req.user.id, body);
  }

  @Delete('admin/api-keys/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  revokeApiKey(@Request() req: any, @Param('id') id: string) {
    this.assertCompanyAdmin(req.user);
    return this.service.revokeApiKey(req.user.tenantId, id);
  }

  // ─── Incidents ───

  @Get('super-admin/incidents')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  listIncidents(@Request() req: any, @Query('status') status?: string) {
    this.assertSuper(req.user);
    return this.service.listIncidents({ status });
  }

  @Post('super-admin/incidents')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  createIncident(@Request() req: any, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.createIncident(req.user.id, body);
  }

  @Post('super-admin/incidents/:id/updates')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  addIncidentUpdate(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    this.assertSuper(req.user);
    return this.service.addIncidentUpdate(id, body);
  }

  @Delete('super-admin/incidents/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  deleteIncident(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.deleteIncident(id);
  }

  /** Public status page data */
  @Get('status')
  @Throttle({ short: { limit: 30, ttl: 10000 } })
  publicStatus() {
    return this.service.listPublicIncidents();
  }

  private assertSuper(user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Sadece süper admin');
  }
  private assertCompanyAdmin(user: any) {
    if (!user || !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) throw new ForbiddenException();
  }
}
