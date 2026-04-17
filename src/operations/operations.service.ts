import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import * as os from 'os';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);
  private readonly startTime = Date.now();

  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ════════════════════════════════════════════════════════════════
  // Platform Settings
  // ════════════════════════════════════════════════════════════════

  async listSettings() {
    return this.prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async getSetting(key: string): Promise<any> {
    const s = await this.prisma.platformSetting.findUnique({ where: { key } });
    if (!s) return null;
    return this.deserializeValue(s.value, s.type);
  }

  /** Resolve the full merged settings with defaults applied. */
  async getEffectiveSettings() {
    const defaults: Record<string, { value: any; type: string; label: string; category: string }> = {
      MAINTENANCE_MODE: { value: false, type: 'boolean', label: 'Bakım Modu', category: 'platform' },
      MAINTENANCE_MESSAGE: { value: 'Sistem bakımda, kısa süre içinde geri döneceğiz.', type: 'string', label: 'Bakım Mesajı', category: 'platform' },
      DEFAULT_COMMISSION_RATE: { value: 0.08, type: 'number', label: 'Varsayılan Komisyon Oranı', category: 'financial' },
      MIN_TICKET_PRICE: { value: 50, type: 'number', label: 'Min Bilet Fiyatı (TL)', category: 'financial' },
      MAX_TICKET_PRICE: { value: 10000, type: 'number', label: 'Max Bilet Fiyatı (TL)', category: 'financial' },
      CANCEL_WINDOW_HOURS: { value: 6, type: 'number', label: 'İptal Penceresi (saat)', category: 'policy' },
      PROMO_MAX_DISCOUNT: { value: 50000, type: 'number', label: 'Max Promo İndirim (TL)', category: 'policy' },
      NEW_TENANT_AUTO_APPROVE: { value: false, type: 'boolean', label: 'Yeni Firma Otomatik Onay', category: 'platform' },
      ENFORCE_2FA_SUPER_ADMIN: { value: true, type: 'boolean', label: 'Super Admin için 2FA Zorunlu', category: 'security' },
      SESSION_TTL_HOURS: { value: 24, type: 'number', label: 'Oturum Süresi (saat)', category: 'security' },
      PLATFORM_NAME: { value: 'TransitIQ', type: 'string', label: 'Platform Adı', category: 'brand' },
      SUPPORT_EMAIL: { value: 'destek@transitiq.com', type: 'string', label: 'Platform Destek E-postası', category: 'brand' },
    };

    const stored = await this.prisma.platformSetting.findMany();
    const storedMap = new Map(stored.map((s) => [s.key, this.deserializeValue(s.value, s.type)]));

    return Object.entries(defaults).map(([key, def]) => ({
      key,
      value: storedMap.has(key) ? storedMap.get(key) : def.value,
      defaultValue: def.value,
      type: def.type,
      label: def.label,
      category: def.category,
      isCustomized: storedMap.has(key),
    }));
  }

  async updateSetting(key: string, rawValue: any, updatedBy: string) {
    if (!key || key.length < 2) throw new BadRequestException('Geçersiz anahtar');
    const type = typeof rawValue === 'boolean' ? 'boolean'
      : typeof rawValue === 'number' ? 'number'
      : typeof rawValue === 'object' ? 'json'
      : 'string';
    const value = type === 'json' ? JSON.stringify(rawValue) : String(rawValue);
    const result = await this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value, type, updatedBy },
      update: { value, type, updatedBy },
    });
    this.logger.log(`[Platform Settings] ${key} = ${value} by ${updatedBy}`);
    return result;
  }

  async resetSetting(key: string) {
    await this.prisma.platformSetting.delete({ where: { key } }).catch(() => {});
    return { reset: true };
  }

  private deserializeValue(raw: string, type: string): any {
    switch (type) {
      case 'boolean': return raw === 'true';
      case 'number': return Number(raw);
      case 'json': try { return JSON.parse(raw); } catch { return null; }
      default: return raw;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Tenant Notes & Tags
  // ════════════════════════════════════════════════════════════════

  async listNotes(tenantId: string) {
    const notes = await this.prisma.tenantNote.findMany({
      where: { tenantId },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
    const authorIds = Array.from(new Set(notes.map((n) => n.authorId)));
    const authors = authorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];
    const authorMap = new Map(authors.map((a) => [a.id, a]));
    return notes.map((n) => ({ ...n, author: authorMap.get(n.authorId) || null }));
  }

  async createNote(tenantId: string, authorId: string, body: string, pinned = false) {
    if (!body?.trim()) throw new BadRequestException('Not içeriği boş olamaz');
    return this.prisma.tenantNote.create({
      data: { tenantId, authorId, body: body.trim().slice(0, 4000), pinned },
    });
  }

  async updateNote(id: string, data: { body?: string; pinned?: boolean }) {
    const update: any = {};
    if (data.body !== undefined) update.body = data.body.trim().slice(0, 4000);
    if (data.pinned !== undefined) update.pinned = data.pinned;
    return this.prisma.tenantNote.update({ where: { id }, data: update });
  }

  async deleteNote(id: string) {
    return this.prisma.tenantNote.delete({ where: { id } });
  }

  async listTags(tenantId: string) {
    return this.prisma.tenantTag.findMany({ where: { tenantId }, orderBy: { label: 'asc' } });
  }

  async addTag(tenantId: string, label: string, color?: string) {
    if (!label?.trim()) throw new BadRequestException('Etiket boş olamaz');
    return this.prisma.tenantTag.create({
      data: { tenantId, label: label.trim().slice(0, 30), color: color || null },
    }).catch(() => { throw new BadRequestException('Bu etiket zaten var'); });
  }

  async removeTag(id: string) {
    return this.prisma.tenantTag.delete({ where: { id } });
  }

  async getTenantTimeline(tenantId: string) {
    // Compose timeline from audit log events concerning this tenant
    const entries = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: 50,
      select: {
        id: true, action: true, entityType: true, entityId: true,
        oldValues: true, newValues: true, timestamp: true,
        user: { select: { name: true, email: true, role: true } },
      },
    });
    return entries;
  }

  // ════════════════════════════════════════════════════════════════
  // KVKK / Data Requests
  // ════════════════════════════════════════════════════════════════

  async createDataRequest(data: {
    type: 'EXPORT' | 'DELETE' | 'CORRECT' | 'RESTRICT';
    contactEmail: string;
    contactName: string;
    reason?: string;
    userId?: string;
  }) {
    if (!['EXPORT', 'DELETE', 'CORRECT', 'RESTRICT'].includes(data.type)) {
      throw new BadRequestException('Geçersiz talep tipi');
    }
    if (!data.contactEmail?.includes('@')) throw new BadRequestException('Geçerli e-posta gerekli');
    return this.prisma.dataRequest.create({
      data: {
        type: data.type,
        contactEmail: data.contactEmail.toLowerCase().trim(),
        contactName: data.contactName?.trim() || 'Belirtilmemiş',
        reason: data.reason?.trim() || null,
        userId: data.userId || null,
      },
    });
  }

  async listDataRequests(opts: { status?: string; take?: number; skip?: number } = {}) {
    const { status, take = 50, skip = 0 } = opts;
    const where: any = {};
    if (status) where.status = status;
    const [items, total, stats] = await Promise.all([
      this.prisma.dataRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
      this.prisma.dataRequest.count({ where }),
      this.prisma.dataRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const statsMap = stats.reduce((acc, s) => { acc[s.status] = s._count._all; return acc; }, {} as Record<string, number>);
    return {
      items, total,
      stats: {
        pending: statsMap.PENDING || 0,
        inProgress: statsMap.IN_PROGRESS || 0,
        completed: statsMap.COMPLETED || 0,
        rejected: statsMap.REJECTED || 0,
      },
    };
  }

  async updateDataRequest(id: string, data: { status?: string; resolution?: string; handledBy?: string }) {
    const req = await this.prisma.dataRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException();
    const update: any = {};
    if (data.status) {
      if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].includes(data.status)) {
        throw new BadRequestException('Geçersiz durum');
      }
      update.status = data.status;
      if (data.status === 'COMPLETED' || data.status === 'REJECTED') {
        update.resolvedAt = new Date();
      }
    }
    if (data.resolution !== undefined) update.resolution = data.resolution;
    if (data.handledBy) update.handledBy = data.handledBy;
    return this.prisma.dataRequest.update({ where: { id }, data: update });
  }

  /** Export all user data as a JSON blob. For DELETE-type requests, deletes everything after export. */
  async exportUserData(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        bookings: {
          include: {
            trip: { include: { route: { include: { originStation: true, destinationStation: true } } } },
            seat: { select: { seatNumber: true, type: true } },
          },
        },
        walletTransactions: true,
        priceAlerts: true,
      },
    });
    if (!user) {
      const guestBookings = await this.prisma.booking.findMany({
        where: { contactEmail: email.toLowerCase() },
        include: {
          trip: { include: { route: { include: { originStation: true, destinationStation: true } } } },
          seat: { select: { seatNumber: true, type: true } },
        },
      });
      return { user: null, guestBookings };
    }
    return {
      user: {
        id: user.id, email: user.email, name: user.name,
        phoneNumber: user.phoneNumber, role: user.role,
        emailVerifiedAt: user.emailVerifiedAt, createdAt: user.createdAt,
        walletBalance: Number(user.walletBalance),
        badges: user.badges, totalTrips: user.totalTrips,
      },
      bookings: user.bookings.map((b) => ({
        pnrCode: b.pnrCode, status: b.status,
        pricePaid: Number(b.pricePaid), bookingTime: b.bookingTime,
        passengerName: b.passengerName, passengerTcNo: b.passengerTcNo,
        seat: b.seat,
        trip: {
          departureTime: b.trip.departureTime,
          origin: b.trip.route.originStation.city,
          destination: b.trip.route.destinationStation.city,
        },
      })),
      walletTransactions: user.walletTransactions,
      priceAlerts: user.priceAlerts,
      generatedAt: new Date().toISOString(),
    };
  }

  async deleteUserData(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return { deleted: 0 };
    // Soft delete — mark as deleted + anonymize
    const anonEmail = `deleted-${Date.now()}@removed.transitiq`;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        email: anonEmail,
        name: 'Silinmiş Kullanıcı',
        phoneNumber: null,
        passwordHash: 'DELETED',
        googleId: null,
        avatarUrl: null,
      },
    });
    // Anonymize bookings (keep for tax/legal but strip PII)
    await this.prisma.booking.updateMany({
      where: { userId: user.id },
      data: {
        passengerName: 'Silinmiş',
        passengerTcNo: '00000000000',
        contactEmail: anonEmail,
        contactPhone: '0000000000',
      },
    });
    return { deleted: 1 };
  }

  // ════════════════════════════════════════════════════════════════
  // System Health
  // ════════════════════════════════════════════════════════════════

  async getSystemHealth() {
    const checks: Array<{ name: string; status: 'OK' | 'WARN' | 'FAIL'; latencyMs?: number; detail?: string }> = [];

    // DB
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.push({ name: 'PostgreSQL', status: 'OK', latencyMs: Date.now() - dbStart });
    } catch (err: any) {
      checks.push({ name: 'PostgreSQL', status: 'FAIL', detail: err.message });
    }

    // Resend (email)
    const resendKey = process.env.RESEND_API_KEY;
    checks.push({
      name: 'Resend (E-posta)',
      status: resendKey ? 'OK' : 'WARN',
      detail: resendKey ? 'API key yapılandırılmış' : 'API key yok (e-posta devre dışı)',
    });

    // Iyzico
    const iyzicoKey = process.env.IYZICO_API_KEY;
    checks.push({
      name: 'Iyzico (Ödeme)',
      status: iyzicoKey ? 'OK' : 'WARN',
      detail: iyzicoKey ? 'API key yapılandırılmış' : 'API key yok (ödeme devre dışı)',
    });

    // Uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    checks.push({
      name: 'Uploads Dizini',
      status: fs.existsSync(uploadsDir) ? 'OK' : 'WARN',
      detail: fs.existsSync(uploadsDir) ? uploadsDir : 'İlk upload\'ta oluşturulacak',
    });

    // Memory
    const mem = process.memoryUsage();
    const heapMb = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
    const memStatus: 'OK' | 'WARN' | 'FAIL' = heapMb > 500 ? 'WARN' : 'OK';
    checks.push({
      name: 'Memory (Node heap)',
      status: memStatus,
      detail: `${heapMb} MB / ${heapTotalMb} MB`,
    });

    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    // Business metrics (last 24h pulse)
    const last24h = new Date(Date.now() - 24 * 3600 * 1000);
    const [recentBookings, recentErrors, activeTrips, pendingComplaints, openDataRequests] = await Promise.all([
      this.prisma.booking.count({ where: { bookingTime: { gte: last24h } } }),
      this.prisma.booking.count({ where: { refundStatus: 'FAILED', bookingTime: { gte: last24h } } }),
      this.prisma.trip.count({ where: { status: 'ACTIVE' } }),
      this.prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.dataRequest.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    ]);

    const overall = checks.some((c) => c.status === 'FAIL')
      ? 'DEGRADED'
      : checks.some((c) => c.status === 'WARN') ? 'WARNING' : 'HEALTHY';

    return {
      overall,
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      node: {
        version: process.version,
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memoryTotalGb: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10,
      },
      checks,
      business: {
        bookingsLast24h: recentBookings,
        failedRefundsLast24h: recentErrors,
        activeTrips,
        pendingComplaints,
        openDataRequests,
      },
    };
  }
}
