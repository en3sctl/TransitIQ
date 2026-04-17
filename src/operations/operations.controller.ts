import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { OperationsService } from './operations.service';

@ApiTags('Operations')
@Controller()
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  // ─── Public maintenance check ───

  @Get('platform/maintenance')
  @Throttle({ short: { limit: 60, ttl: 10000 } })
  async maintenanceStatus() {
    const mode = await this.service.getSetting('MAINTENANCE_MODE');
    const message = await this.service.getSetting('MAINTENANCE_MESSAGE');
    return { maintenance: !!mode, message: message || null };
  }

  // ─── Platform Settings (super-admin) ───

  @Get('super-admin/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listSettings(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.getEffectiveSettings();
  }

  @Patch('super-admin/settings/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateSetting(@Request() req: any, @Param('key') key: string, @Body() body: { value: any }) {
    this.assertSuper(req.user);
    return this.service.updateSetting(key, body.value, req.user.id);
  }

  @Delete('super-admin/settings/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  resetSetting(@Request() req: any, @Param('key') key: string) {
    this.assertSuper(req.user);
    return this.service.resetSetting(key);
  }

  // ─── Tenant Notes & Tags (super-admin) ───

  @Get('super-admin/tenants/:id/notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listNotes(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.listNotes(id);
  }

  @Post('super-admin/tenants/:id/notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createNote(@Request() req: any, @Param('id') id: string, @Body() body: { body: string; pinned?: boolean }) {
    this.assertSuper(req.user);
    return this.service.createNote(id, req.user.id, body.body, body.pinned);
  }

  @Patch('super-admin/notes/:noteId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateNote(@Request() req: any, @Param('noteId') noteId: string, @Body() body: { body?: string; pinned?: boolean }) {
    this.assertSuper(req.user);
    return this.service.updateNote(noteId, body);
  }

  @Delete('super-admin/notes/:noteId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteNote(@Request() req: any, @Param('noteId') noteId: string) {
    this.assertSuper(req.user);
    return this.service.deleteNote(noteId);
  }

  @Get('super-admin/tenants/:id/tags')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listTags(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.listTags(id);
  }

  @Post('super-admin/tenants/:id/tags')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addTag(@Request() req: any, @Param('id') id: string, @Body() body: { label: string; color?: string }) {
    this.assertSuper(req.user);
    return this.service.addTag(id, body.label, body.color);
  }

  @Delete('super-admin/tags/:tagId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  removeTag(@Request() req: any, @Param('tagId') tagId: string) {
    this.assertSuper(req.user);
    return this.service.removeTag(tagId);
  }

  @Get('super-admin/tenants/:id/timeline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  tenantTimeline(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    return this.service.getTenantTimeline(id);
  }

  // ─── KVKK / Data Requests ───

  /** Public endpoint — any user (authed or not) can submit a request */
  @Post('kvkk/requests')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  createDataRequest(
    @Request() req: any,
    @Body() body: { type: 'EXPORT' | 'DELETE' | 'CORRECT' | 'RESTRICT'; contactEmail: string; contactName: string; reason?: string },
  ) {
    return this.service.createDataRequest({
      ...body,
      userId: req.user?.id,
    });
  }

  @Get('super-admin/kvkk-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listDataRequests(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertSuper(req.user);
    return this.service.listDataRequests({
      status,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Patch('super-admin/kvkk-requests/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateDataRequest(
    @Request() req: any, @Param('id') id: string,
    @Body() body: { status?: string; resolution?: string },
  ) {
    this.assertSuper(req.user);
    return this.service.updateDataRequest(id, { ...body, handledBy: req.user.id });
  }

  @Get('super-admin/kvkk-requests/:id/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async exportRequestData(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    const request = await this.service.listDataRequests({}).then((r) => r.items.find((i) => i.id === id));
    if (!request) throw new ForbiddenException();
    const data = await this.service.exportUserData(request.contactEmail);
    return { request, data };
  }

  @Post('super-admin/kvkk-requests/:id/execute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async executeDeletion(@Request() req: any, @Param('id') id: string) {
    this.assertSuper(req.user);
    const list = await this.service.listDataRequests({});
    const request = list.items.find((i) => i.id === id);
    if (!request) throw new ForbiddenException();
    if (request.type !== 'DELETE') throw new ForbiddenException('Sadece DELETE tipi talepler execute edilebilir');
    const result = await this.service.deleteUserData(request.contactEmail);
    await this.service.updateDataRequest(id, {
      status: 'COMPLETED',
      resolution: `${result.deleted} kullanıcı kaydı anonimize edildi.`,
      handledBy: req.user.id,
    });
    return result;
  }

  // ─── System Health ───

  @Get('super-admin/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  health(@Request() req: any) {
    this.assertSuper(req.user);
    return this.service.getSystemHealth();
  }

  /** Public health endpoint for uptime checks */
  @Get('health')
  @Throttle({ short: { limit: 60, ttl: 10000 } })
  publicHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  private assertSuper(user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Sadece süper admin');
  }
}
