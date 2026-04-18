import {
  Body, Controller, Delete, Get, Param, Patch, Post, Request,
  UploadedFile, UseGuards, UseInterceptors, ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantService } from './tenant.service';
import type { UpdateTenantSettingsDto, UpdatePaymentSettingsDto } from './tenant.service';

@ApiTags('Tenant')
@Controller()
export class TenantController {
  constructor(private readonly service: TenantService) {}

  // ─── Admin: settings for own tenant ───

  @Get('admin/tenant/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMine(@Request() req: any) {
    return this.service.getMine(req.user.tenantId);
  }

  @Get('admin/tenant/me/usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getUsage(@Request() req: any) {
    return this.service.getPlanUsage(req.user.tenantId);
  }

  @Patch('admin/tenant/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Request() req: any, @Body() dto: UpdateTenantSettingsDto) {
    this.assertCompanyAdmin(req.user);
    return this.service.updateSettings(req.user.tenantId, dto);
  }

  @Patch('admin/tenant/me/payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updatePayment(@Request() req: any, @Body() dto: UpdatePaymentSettingsDto) {
    this.assertCompanyAdmin(req.user);
    return this.service.updatePayment(req.user.tenantId, dto);
  }

  @Post('admin/tenant/me/logo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', {
    limits: { fileSize: 4 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/i.test(file.mimetype)) {
        return cb(new Error('Sadece PNG/JPG/WebP/SVG kabul edilir'), false);
      }
      cb(null, true);
    },
  }))
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  uploadLogo(@Request() req: any, @UploadedFile() file: any) {
    this.assertCompanyAdmin(req.user);
    if (!file) throw new ForbiddenException('Logo dosyası gerekli');
    return this.service.uploadLogo(req.user.tenantId, file.buffer, file.originalname);
  }

  @Delete('admin/tenant/me/logo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  removeLogo(@Request() req: any) {
    this.assertCompanyAdmin(req.user);
    return this.service.removeLogo(req.user.tenantId);
  }

  // ─── Public: firma profile by slug ───

  @Get('firma/:slug')
  @Throttle({ short: { limit: 30, ttl: 10000 } })
  publicProfile(@Param('slug') slug: string) {
    return this.service.getPublicBySlug(slug);
  }

  // ─── Super-admin: platform-level tenant mgmt ───

  @Get('super-admin/tenants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  superList(@Request() req: any) {
    this.assertSuperAdmin(req.user);
    return this.service.superAdminList();
  }

  @Patch('super-admin/tenants/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  superSetStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' },
  ) {
    this.assertSuperAdmin(req.user);
    return this.service.superAdminSetStatus(id, body.status);
  }

  @Patch('super-admin/tenants/:id/commission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  superSetCommission(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { rate: number },
  ) {
    this.assertSuperAdmin(req.user);
    return this.service.superAdminSetCommission(id, Number(body.rate));
  }

  @Patch('super-admin/tenants/:id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  superVerify(@Request() req: any, @Param('id') id: string) {
    this.assertSuperAdmin(req.user);
    return this.service.superAdminVerify(id);
  }

  // ─── Guards ───

  private assertCompanyAdmin(user: any) {
    if (!user || !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu işlem için firma admin yetkisi gerekli');
    }
  }
  private assertSuperAdmin(user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Sadece süper admin erişebilir');
    }
  }
}
