import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';

export interface UpdateTenantSettingsDto {
  publicName?: string;
  brandColor?: string;
  aboutShort?: string;
  aboutLong?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  address?: string;
  taxId?: string;
  mersisNo?: string;
  uetdsLicense?: string;
}

export interface UpdatePaymentSettingsDto {
  iyzicoMode?: 'PLATFORM' | 'OWN';
  iyzicoApiKey?: string;
  iyzicoSecretKey?: string;
}

const PUBLIC_FIELDS = {
  id: true, publicName: true, name: true, slug: true, logoUrl: true, brandColor: true,
  aboutShort: true, aboutLong: true, supportEmail: true, supportPhone: true, website: true,
  address: true, verifiedAt: true, status: true, createdAt: true,
} as const;

@Injectable()
export class TenantService {
  private readonly uploadsRoot = path.join(process.cwd(), 'uploads', 'tenants');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadsRoot)) {
      fs.mkdirSync(this.uploadsRoot, { recursive: true });
    }
  }

  /** Admin: get own tenant (including admin-only fields) */
  async getMine(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true, name: true, publicName: true, slug: true, domain: true, status: true,
        logoUrl: true, brandColor: true, aboutShort: true, aboutLong: true,
        supportEmail: true, supportPhone: true, website: true, address: true,
        taxId: true, mersisNo: true, uetdsLicense: true, verifiedAt: true,
        iyzicoMode: true,
        // iyzico keys are only surfaced as "configured: boolean" for safety
        commissionRate: true, createdAt: true,
      },
    });
    if (!t) throw new NotFoundException();
    const full = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { iyzicoApiKey: true, iyzicoSecretKey: true },
    });
    return {
      ...t,
      commissionRate: Number(t.commissionRate),
      payment: {
        mode: t.iyzicoMode,
        hasOwnCredentials: !!(full?.iyzicoApiKey && full?.iyzicoSecretKey),
      },
    };
  }

  /**
   * Plan kullanımı: tenant'ın mevcut plan limiti + şu anki kullanımı.
   * Firma admin panelinde "Plan Kullanımı" kartında gösterilir.
   */
  async getPlanUsage(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });
    if (!tenant) throw new NotFoundException();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [vehicleCount, routeCount, monthlyBookings] = await Promise.all([
      this.prisma.vehicle.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.route.count({ where: { tenantId } }),
      this.prisma.booking.count({
        where: { tenantId, bookingTime: { gte: monthStart }, status: 'CONFIRMED' },
      }),
    ]);

    const plan = tenant.plan ? {
      id: tenant.plan.id,
      name: tenant.plan.name,
      slug: tenant.plan.slug,
      monthlyFee: Number(tenant.plan.monthlyFee),
      commissionRate: Number(tenant.plan.commissionRate),
      maxVehicles: tenant.plan.maxVehicles,
      maxRoutes: tenant.plan.maxRoutes,
      maxMonthlyBookings: tenant.plan.maxMonthlyBookings,
    } : null;

    return {
      plan,
      usage: {
        vehicles: { current: vehicleCount, limit: plan?.maxVehicles ?? null },
        routes: { current: routeCount, limit: plan?.maxRoutes ?? null },
        monthlyBookings: { current: monthlyBookings, limit: plan?.maxMonthlyBookings ?? null },
      },
    };
  }

  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto) {
    if (dto.brandColor && !/^#[0-9a-fA-F]{6}$/.test(dto.brandColor)) {
      throw new BadRequestException('Renk kodu #RRGGBB formatında olmalı');
    }
    if (dto.website && !/^https?:\/\/.+/.test(dto.website)) {
      throw new BadRequestException('Website http(s):// ile başlamalı');
    }
    if (dto.supportEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dto.supportEmail)) {
      throw new BadRequestException('Geçersiz destek e-postası');
    }
    const data: any = {};
    const fields: (keyof UpdateTenantSettingsDto)[] = [
      'publicName', 'brandColor', 'aboutShort', 'aboutLong',
      'supportEmail', 'supportPhone', 'website', 'address',
      'taxId', 'mersisNo', 'uetdsLicense',
    ];
    for (const f of fields) {
      if (dto[f] !== undefined) data[f] = dto[f] === '' ? null : dto[f];
    }
    await this.prisma.tenant.update({ where: { id: tenantId }, data });
    return this.getMine(tenantId);
  }

  async updatePayment(tenantId: string, dto: UpdatePaymentSettingsDto) {
    const data: any = {};
    if (dto.iyzicoMode) {
      if (!['PLATFORM', 'OWN'].includes(dto.iyzicoMode)) {
        throw new BadRequestException('Geçersiz ödeme modu');
      }
      data.iyzicoMode = dto.iyzicoMode;
    }
    if (dto.iyzicoApiKey !== undefined) data.iyzicoApiKey = dto.iyzicoApiKey || null;
    if (dto.iyzicoSecretKey !== undefined) data.iyzicoSecretKey = dto.iyzicoSecretKey || null;

    // If switching to OWN mode, credentials must be present
    if (data.iyzicoMode === 'OWN') {
      const current = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { iyzicoApiKey: true, iyzicoSecretKey: true },
      });
      const apiKey = data.iyzicoApiKey ?? current?.iyzicoApiKey;
      const secret = data.iyzicoSecretKey ?? current?.iyzicoSecretKey;
      if (!apiKey || !secret) {
        throw new BadRequestException('OWN moduna geçmek için Iyzico API/Secret anahtarını girmen lazım');
      }
    }

    await this.prisma.tenant.update({ where: { id: tenantId }, data });
    return this.getMine(tenantId);
  }

  /** Upload + resize logo. Writes to /uploads/tenants/{slug}/logo-{hash}.webp */
  async uploadLogo(tenantId: string, fileBuffer: Buffer, originalName: string) {
    if (fileBuffer.length > 4 * 1024 * 1024) {
      throw new BadRequestException('Logo en fazla 4 MB olabilir');
    }
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, logoUrl: true },
    });
    if (!tenant) throw new NotFoundException();

    const tenantDir = path.join(this.uploadsRoot, tenant.slug);
    if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });

    const hash = crypto.randomBytes(6).toString('hex');
    const fileName = `logo-${hash}.webp`;
    const filePath = path.join(tenantDir, fileName);

    // Resize to max 512x512, convert to webp for bandwidth efficiency
    await sharp(fileBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(filePath);

    const publicUrl = `/uploads/tenants/${tenant.slug}/${fileName}`;

    // Remove old logo file if it was in our uploads tree
    if (tenant.logoUrl && tenant.logoUrl.startsWith('/uploads/tenants/')) {
      const oldPath = path.join(process.cwd(), tenant.logoUrl.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch { /* non-fatal */ }
      }
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: publicUrl },
    });

    return { logoUrl: publicUrl };
  }

  async removeLogo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logoUrl: true },
    });
    if (tenant?.logoUrl && tenant.logoUrl.startsWith('/uploads/tenants/')) {
      const p = path.join(process.cwd(), tenant.logoUrl.replace(/^\//, ''));
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch { /* non-fatal */ }
      }
    }
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: null },
    });
    return { logoUrl: null };
  }

  /** Public: firma profile page data */
  async getPublicBySlug(slug: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { slug },
      select: PUBLIC_FIELDS,
    });
    if (!t || t.status !== 'ACTIVE') throw new NotFoundException('Firma bulunamadı');

    const [routeCount, tripCount, avgRating, bookingCount] = await Promise.all([
      this.prisma.route.count({ where: { tenantId: t.id } }),
      this.prisma.trip.count({ where: { tenantId: t.id, status: 'PLANNED', departureTime: { gte: new Date() } } }),
      this.prisma.review.aggregate({
        where: { tenantId: t.id, hidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.booking.count({ where: { tenantId: t.id, status: 'CONFIRMED' } }),
    ]);

    return {
      ...t,
      stats: {
        routes: routeCount,
        upcomingTrips: tripCount,
        averageRating: avgRating._avg.rating ? Math.round(Number(avgRating._avg.rating) * 10) / 10 : 0,
        reviewCount: avgRating._count._all,
        totalBookings: bookingCount,
      },
    };
  }

  /** Super-admin: list all tenants */
  async superAdminList() {
    const tenants = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, publicName: true, slug: true, domain: true, status: true,
        logoUrl: true, verifiedAt: true, commissionRate: true, iyzicoMode: true, createdAt: true,
        _count: { select: { users: true, vehicles: true, routes: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return tenants.map((t) => ({
      ...t,
      commissionRate: Number(t.commissionRate),
    }));
  }

  async superAdminSetStatus(tenantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING') {
    if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      throw new BadRequestException('Geçersiz durum');
    }
    return this.prisma.tenant.update({ where: { id: tenantId }, data: { status } });
  }

  async superAdminSetCommission(tenantId: string, rate: number) {
    if (rate < 0 || rate > 0.5) {
      throw new BadRequestException('Komisyon oranı 0–0.5 arası olmalı (%0–%50)');
    }
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { commissionRate: rate },
    });
  }

  async superAdminVerify(tenantId: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { verifiedAt: new Date() },
    });
  }
}
