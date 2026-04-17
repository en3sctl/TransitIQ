import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  // ─── Platform Overview ───────────────────────────────────────────────

  async getOverview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(now.getTime() - 7 * 86400000);
    const last30 = new Date(now.getTime() - 30 * 86400000);
    const prev30 = new Date(now.getTime() - 60 * 86400000);

    const [
      totalTenants, activeTenants, pendingTenants, suspendedTenants,
      totalBookings, totalUsers, confirmedBookings,
      gmvAll, gmvLast30, gmvPrev30, gmvToday,
      commissionAll, commissionLast30,
      newTenantsLast7, newUsersLast7,
      topTenants,
      pendingComplaints, failedRefunds,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.prisma.booking.count(),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { pricePaid: true },
      }),
      this.prisma.booking.aggregate({
        where: { status: 'CONFIRMED', bookingTime: { gte: last30 } },
        _sum: { pricePaid: true },
      }),
      this.prisma.booking.aggregate({
        where: { status: 'CONFIRMED', bookingTime: { gte: prev30, lt: last30 } },
        _sum: { pricePaid: true },
      }),
      this.prisma.booking.aggregate({
        where: { status: 'CONFIRMED', bookingTime: { gte: todayStart } },
        _sum: { pricePaid: true },
      }),
      this.prisma.settlement.aggregate({
        _sum: { commissionAmount: true },
      }),
      this.prisma.settlement.aggregate({
        where: { createdAt: { gte: last30 } },
        _sum: { commissionAmount: true },
      }),
      this.prisma.tenant.count({
        where: { deletedAt: null, createdAt: { gte: last7 } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: last7 } },
      }),
      this.getTopTenants(10, last30),
      this.prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.booking.count({ where: { refundStatus: 'FAILED' } }),
    ]);

    // GMV trend by day (last 30 days)
    const dailySeries = await this.getDailySeries(30);

    const gmv30 = Number(gmvLast30._sum.pricePaid || 0);
    const gmvPrev = Number(gmvPrev30._sum.pricePaid || 0);
    const growthPct = gmvPrev > 0 ? ((gmv30 - gmvPrev) / gmvPrev) * 100 : (gmv30 > 0 ? 100 : 0);

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        pending: pendingTenants,
        suspended: suspendedTenants,
        newLast7: newTenantsLast7,
      },
      users: {
        total: totalUsers,
        newLast7: newUsersLast7,
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
      },
      gmv: {
        all: Number(gmvAll._sum.pricePaid || 0),
        today: Number(gmvToday._sum.pricePaid || 0),
        last30: gmv30,
        prev30: gmvPrev,
        growthPct: Math.round(growthPct * 10) / 10,
      },
      commission: {
        all: Number(commissionAll._sum.commissionAmount || 0),
        last30: Number(commissionLast30._sum.commissionAmount || 0),
      },
      alerts: {
        pendingApprovals: pendingTenants,
        pendingComplaints,
        failedRefunds,
      },
      topTenants,
      dailySeries,
    };
  }

  /** Top tenants by booking revenue in the given window. */
  private async getTopTenants(take: number, since: Date) {
    const grouped = await this.prisma.booking.groupBy({
      by: ['tenantId'],
      where: { status: 'CONFIRMED', bookingTime: { gte: since } },
      _sum: { pricePaid: true },
      _count: { _all: true },
      orderBy: { _sum: { pricePaid: 'desc' } },
      take,
    });
    const tenantIds = grouped.map((g) => g.tenantId);
    const tenants = tenantIds.length
      ? await this.prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true, publicName: true, slug: true, logoUrl: true },
        })
      : [];
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));
    return grouped.map((g) => ({
      tenant: tenantMap.get(g.tenantId) || { id: g.tenantId, name: 'Bilinmeyen', publicName: null, slug: '', logoUrl: null },
      bookingCount: g._count._all,
      revenue: Number(g._sum.pricePaid || 0),
    }));
  }

  /** Daily GMV + booking count series for the last N days. */
  private async getDailySeries(days: number) {
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    start.setHours(0, 0, 0, 0);

    // Pull all relevant bookings, bucket client-side (cheaper than N queries)
    const bookings = await this.prisma.booking.findMany({
      where: { status: 'CONFIRMED', bookingTime: { gte: start } },
      select: { pricePaid: true, bookingTime: true },
    });

    const buckets = new Map<string, { date: string; revenue: number; count: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, revenue: 0, count: 0 });
    }
    for (const b of bookings) {
      const key = b.bookingTime.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.revenue += Number(b.pricePaid);
      bucket.count += 1;
    }
    return Array.from(buckets.values());
  }

  // ─── Pending Approvals ───────────────────────────────────────────────

  async listPendingApprovals() {
    const tenants = await this.prisma.tenant.findMany({
      where: { deletedAt: null, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, name: true, publicName: true, slug: true, domain: true,
        logoUrl: true, supportEmail: true, supportPhone: true, website: true, address: true,
        taxId: true, mersisNo: true, uetdsLicense: true, aboutShort: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });
    return tenants.map((t) => ({
      ...t,
      // Signal of document completeness
      docsComplete: !!(t.taxId && t.mersisNo && t.uetdsLicense),
    }));
  }

  async approveTenant(tenantId: string, actorId: string) {
    const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!t) throw new NotFoundException();
    if (t.status === 'ACTIVE') throw new BadRequestException('Firma zaten aktif');

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'ACTIVE', verifiedAt: t.verifiedAt || new Date() },
    });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'TENANT_APPROVE',
      entityType: 'TENANT', entityId: tenantId,
      oldValues: { status: t.status },
      newValues: { status: 'ACTIVE' },
    });
    return updated;
  }

  async rejectTenant(tenantId: string, reason: string, actorId: string) {
    const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!t) throw new NotFoundException();
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'SUSPENDED' },
    });
    this.audit.log({
      tenantId, userId: actorId,
      action: 'TENANT_REJECT',
      entityType: 'TENANT', entityId: tenantId,
      oldValues: { status: t.status },
      newValues: { status: 'SUSPENDED', reason },
    });
    return updated;
  }

  // ─── Tenant Impersonation ────────────────────────────────────────────

  /**
   * Issues a short-lived JWT for the COMPANY_ADMIN of the given tenant,
   * on behalf of a SUPER_ADMIN. Heavily audited. The token embeds
   * `impersonatedBy` so every downstream action can be traced back.
   */
  async impersonateTenantAdmin(tenantId: string, superAdminId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, status: true },
    });
    if (!tenant) throw new NotFoundException('Firma bulunamadı');

    // Pick the first COMPANY_ADMIN of the tenant (could be expanded to a dropdown)
    const targetUser = await this.prisma.user.findFirst({
      where: { tenantId, role: 'COMPANY_ADMIN', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, name: true, role: true, tenantId: true },
    });
    if (!targetUser) throw new NotFoundException('Bu firmada admin kullanıcı yok');

    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
      select: { id: true, email: true, name: true },
    });

    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      tenantId: targetUser.tenantId,
      impersonatedBy: {
        userId: superAdminId,
        email: superAdmin?.email,
        name: superAdmin?.name,
      },
    };

    // Short-lived token (30 minutes)
    const token = await this.jwt.signAsync(payload, { expiresIn: '30m' });

    this.audit.log({
      tenantId, userId: superAdminId,
      action: 'IMPERSONATE_START',
      entityType: 'USER', entityId: targetUser.id,
      newValues: { targetEmail: targetUser.email, targetName: targetUser.name },
    });

    this.logger.warn(`[IMPERSONATION] ${superAdmin?.email} impersonating ${targetUser.email} (tenant=${tenant.name})`);

    return {
      token,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        tenantId: targetUser.tenantId,
      },
      tenant,
      expiresInSeconds: 30 * 60,
    };
  }

  // ─── Cross-tenant Booking Lookup ─────────────────────────────────────

  async lookupBookings(query: string, take = 30) {
    const q = query.trim();
    if (q.length < 2) return [];
    const bookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { pnrCode: { equals: q.toUpperCase() } },
          { pnrCode: { contains: q.toUpperCase(), mode: 'insensitive' } },
          { passengerName: { contains: q, mode: 'insensitive' } },
          { contactEmail: { contains: q, mode: 'insensitive' } },
          { contactPhone: { contains: q } },
        ],
      },
      orderBy: { bookingTime: 'desc' },
      take,
      select: {
        id: true, pnrCode: true, status: true, pricePaid: true, bookingTime: true,
        passengerName: true, contactEmail: true, contactPhone: true,
        refundStatus: true,
        tenant: { select: { id: true, name: true, publicName: true, slug: true, logoUrl: true } },
        trip: {
          select: {
            departureTime: true,
            route: {
              select: {
                originStation: { select: { city: true } },
                destinationStation: { select: { city: true } },
              },
            },
          },
        },
        seat: { select: { seatNumber: true } },
      },
    });
    return bookings;
  }

  // ─── Global Audit Log ────────────────────────────────────────────────

  async getAuditLog(opts: { action?: string; tenantId?: string; userId?: string; take?: number; skip?: number } = {}) {
    const { action, tenantId, userId, take = 100, skip = 0 } = opts;
    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take, skip,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          tenant: { select: { id: true, name: true, publicName: true, slug: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }

  // ─── Announcements ───────────────────────────────────────────────────

  async listAnnouncements() {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async listActiveForAudience(audience: string) {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        active: true,
        audience: { in: ['ALL', audience] },
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, body: true, severity: true, linkUrl: true, linkLabel: true,
        startsAt: true, endsAt: true, audience: true,
      },
    });
  }

  async createAnnouncement(createdBy: string, data: {
    title: string; body: string; audience?: string; severity?: string;
    linkUrl?: string; linkLabel?: string; startsAt?: string; endsAt?: string;
  }) {
    if (!data.title || !data.body) throw new BadRequestException('Başlık ve içerik gerekli');
    const audience = ['ALL', 'COMPANY_ADMINS', 'PASSENGERS', 'DRIVERS'].includes(data.audience || '') ? data.audience! : 'ALL';
    const severity = ['INFO', 'WARNING', 'CRITICAL'].includes(data.severity || '') ? data.severity! : 'INFO';
    return this.prisma.announcement.create({
      data: {
        title: data.title.trim().slice(0, 200),
        body: data.body.trim().slice(0, 4000),
        audience, severity,
        linkUrl: data.linkUrl || null,
        linkLabel: data.linkLabel || null,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        createdBy,
      },
    });
  }

  async updateAnnouncement(id: string, data: any) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    const update: any = {};
    for (const k of ['title', 'body', 'audience', 'severity', 'linkUrl', 'linkLabel', 'active']) {
      if (data[k] !== undefined) update[k] = data[k];
    }
    if (data.startsAt) update.startsAt = new Date(data.startsAt);
    if (data.endsAt !== undefined) update.endsAt = data.endsAt ? new Date(data.endsAt) : null;
    return this.prisma.announcement.update({ where: { id }, data: update });
  }

  async deleteAnnouncement(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }

  // ─── Global Users ────────────────────────────────────────────────────

  async listUsers(opts: { q?: string; role?: string; tenantId?: string; suspended?: boolean; take?: number; skip?: number } = {}) {
    const { q, role, tenantId, suspended, take = 50, skip = 0 } = opts;
    const where: any = { deletedAt: null };
    if (q && q.length >= 2) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (tenantId) where.tenantId = tenantId;
    if (suspended === true) where.suspendedAt = { not: null };
    if (suspended === false) where.suspendedAt = null;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take, skip,
        select: {
          id: true, name: true, email: true, role: true,
          emailVerifiedAt: true, createdAt: true,
          suspendedAt: true, suspendedReason: true,
          tenant: { select: { id: true, name: true, publicName: true, slug: true } },
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async suspendUser(userId: string, reason: string, actorId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, tenantId: true, suspendedAt: true } });
    if (!u) throw new NotFoundException();
    if (u.suspendedAt) throw new BadRequestException('Zaten askıda');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: new Date(), suspendedReason: reason || null },
    });
    this.audit.log({
      tenantId: u.tenantId, userId: actorId,
      action: 'USER_SUSPEND',
      entityType: 'USER', entityId: userId,
      newValues: { reason },
    });
    return updated;
  }

  async unsuspendUser(userId: string, actorId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, tenantId: true } });
    if (!u) throw new NotFoundException();
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: null, suspendedReason: null },
    });
    this.audit.log({
      tenantId: u.tenantId, userId: actorId,
      action: 'USER_UNSUSPEND',
      entityType: 'USER', entityId: userId,
    });
    return updated;
  }

  async resetUserPassword(userId: string, actorId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException();
    // Generate a temporary password (16 chars), force-set, let admin share it
    const tempPassword = crypto.randomBytes(9).toString('base64').slice(0, 12);
    const hash = await bcrypt.hash(tempPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
    this.audit.log({
      tenantId: u.tenantId, userId: actorId,
      action: 'USER_PASSWORD_RESET',
      entityType: 'USER', entityId: userId,
    });
    // Return temp password ONCE — frontend shows it to super-admin for secure transfer
    return { tempPassword };
  }
}
