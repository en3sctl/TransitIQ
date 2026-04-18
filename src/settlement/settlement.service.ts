import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';

export interface ListOpts {
  status?: string;
  from?: string;
  to?: string;
  skip?: number;
  take?: number;
}

@Injectable()
export class SettlementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /** Tenant-scoped: list settlements for the company admin. */
  async listForTenant(tenantId: string, opts: ListOpts = {}) {
    const { status, from, to, skip = 0, take = 50 } = opts;
    const where: any = { tenantId };
    if (status && ['PENDING', 'SETTLED', 'REVERSED'].includes(status)) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    const bookingIds = items.map((s) => s.bookingId);
    const bookings = bookingIds.length
      ? await this.prisma.booking.findMany({
          where: { id: { in: bookingIds } },
          select: {
            id: true, pnrCode: true, passengerName: true, bookingTime: true, status: true,
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
          },
        })
      : [];
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));

    return {
      items: items.map((s) => {
        const b = bookingMap.get(s.bookingId);
        return {
          id: s.id,
          status: s.status,
          grossAmount: Number(s.grossAmount),
          commissionAmount: Number(s.commissionAmount),
          netAmount: Number(s.netAmount),
          commissionRate: Number(s.commissionRate),
          createdAt: s.createdAt,
          settledAt: s.settledAt,
          notes: s.notes,
          booking: b
            ? {
                id: b.id,
                pnrCode: b.pnrCode,
                passengerName: b.passengerName,
                bookingTime: b.bookingTime,
                bookingStatus: b.status,
                origin: b.trip.route.originStation.city,
                destination: b.trip.route.destinationStation.city,
                departureTime: b.trip.departureTime,
              }
            : null,
        };
      }),
      total,
    };
  }

  /** Aggregate stats for company admin dashboard header */
  async getTenantSummary(tenantId: string, opts: { from?: string; to?: string } = {}) {
    const where: any = { tenantId };
    if (opts.from || opts.to) {
      where.createdAt = {};
      if (opts.from) where.createdAt.gte = new Date(opts.from);
      if (opts.to) {
        const end = new Date(opts.to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [all, pending, settled, reversed] = await Promise.all([
      this.prisma.settlement.aggregate({
        where,
        _sum: { grossAmount: true, commissionAmount: true, netAmount: true },
        _count: { _all: true },
      }),
      this.prisma.settlement.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { netAmount: true, grossAmount: true },
        _count: { _all: true },
      }),
      this.prisma.settlement.aggregate({
        where: { ...where, status: 'SETTLED' },
        _sum: { netAmount: true, grossAmount: true },
        _count: { _all: true },
      }),
      this.prisma.settlement.aggregate({
        where: { ...where, status: 'REVERSED' },
        _sum: { grossAmount: true, commissionAmount: true },
        _count: { _all: true },
      }),
    ]);

    // Current tenant commission rate (for display)
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { commissionRate: true, iyzicoMode: true },
    });

    // Şoför masrafları — aynı tarih penceresi. Onaylanan = gerçek gider.
    // Bekleyen = potansiyel gider, admin gösterge için ayrıca dönülür.
    const expenseWhere: any = { tenantId };
    if (opts.from || opts.to) {
      expenseWhere.createdAt = {};
      if (opts.from) expenseWhere.createdAt.gte = new Date(opts.from);
      if (opts.to) {
        const end = new Date(opts.to);
        end.setHours(23, 59, 59, 999);
        expenseWhere.createdAt.lte = end;
      }
    }
    const [approvedExpenses, pendingExpenses, expenseByCategory] = await Promise.all([
      (this.prisma as any).driverExpense.aggregate({
        where: { ...expenseWhere, status: 'APPROVED' },
        _sum: { amount: true }, _count: { _all: true },
      }),
      (this.prisma as any).driverExpense.aggregate({
        where: { ...expenseWhere, status: 'PENDING' },
        _sum: { amount: true }, _count: { _all: true },
      }),
      (this.prisma as any).driverExpense.groupBy({
        by: ['category'],
        where: { ...expenseWhere, status: 'APPROVED' },
        _sum: { amount: true }, _count: { _all: true },
      }),
    ]);

    const approvedTotal = Number(approvedExpenses._sum.amount || 0);
    const pendingTotal = Number(pendingExpenses._sum.amount || 0);
    const netAfterExpenses = Number(all._sum.netAmount || 0) - approvedTotal;

    return {
      totalCount: all._count._all,
      totalGross: Number(all._sum.grossAmount || 0),
      totalCommission: Number(all._sum.commissionAmount || 0),
      totalNet: Number(all._sum.netAmount || 0),
      // Yeni: masraf detayı ve net alacak (brüt - komisyon - masraf)
      expenses: {
        approvedCount: approvedExpenses._count._all,
        approvedTotal,
        pendingCount: pendingExpenses._count._all,
        pendingTotal,
        byCategory: expenseByCategory.reduce((acc: any, row: any) => {
          acc[row.category] = { count: row._count._all, total: Number(row._sum.amount || 0) };
          return acc;
        }, {}),
      },
      netAfterExpenses,
      pending: {
        count: pending._count._all,
        net: Number(pending._sum.netAmount || 0),
        gross: Number(pending._sum.grossAmount || 0),
      },
      settled: {
        count: settled._count._all,
        net: Number(settled._sum.netAmount || 0),
        gross: Number(settled._sum.grossAmount || 0),
      },
      reversed: {
        count: reversed._count._all,
        gross: Number(reversed._sum.grossAmount || 0),
      },
      commissionRate: tenant ? Number(tenant.commissionRate) : 0,
      paymentMode: tenant?.iyzicoMode || 'PLATFORM',
    };
  }

  /** Super-admin: list settlements across all tenants */
  async superAdminList(opts: ListOpts & { tenantId?: string } = {}) {
    const { status, from, to, tenantId, skip = 0, take = 100 } = opts;
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (status && ['PENDING', 'SETTLED', 'REVERSED'].includes(status)) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [items, total, totals] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take,
        include: {
          tenant: {
            select: { id: true, name: true, publicName: true, slug: true, logoUrl: true },
          },
        },
      }),
      this.prisma.settlement.count({ where }),
      this.prisma.settlement.aggregate({
        where,
        _sum: { grossAmount: true, commissionAmount: true, netAmount: true },
      }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        tenant: s.tenant,
        bookingId: s.bookingId,
        status: s.status,
        grossAmount: Number(s.grossAmount),
        commissionAmount: Number(s.commissionAmount),
        netAmount: Number(s.netAmount),
        commissionRate: Number(s.commissionRate),
        createdAt: s.createdAt,
        settledAt: s.settledAt,
        notes: s.notes,
      })),
      total,
      totals: {
        gross: Number(totals._sum.grossAmount || 0),
        commission: Number(totals._sum.commissionAmount || 0),
        net: Number(totals._sum.netAmount || 0),
      },
    };
  }

  async markSettled(id: string, notes?: string, actorUserId?: string) {
    const s = await this.prisma.settlement.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    if (s.status === 'SETTLED') throw new BadRequestException('Zaten ödendi');
    const updated = await this.prisma.settlement.update({
      where: { id },
      data: { status: 'SETTLED', settledAt: new Date(), notes: notes || s.notes },
    });
    await this.audit.log({
      tenantId: s.tenantId,
      userId: actorUserId,
      action: 'SETTLEMENT_SETTLE',
      entityType: 'SETTLEMENT',
      entityId: id,
      oldValues: { status: s.status, netAmount: Number(s.netAmount) },
      newValues: { status: 'SETTLED', notes: notes || s.notes },
    });
    return updated;
  }

  async bulkMarkSettled(ids: string[], actorUserId?: string) {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestException();
    const targets = await this.prisma.settlement.findMany({
      where: { id: { in: ids }, status: 'PENDING' },
      select: { id: true, tenantId: true, netAmount: true },
    });
    const result = await this.prisma.settlement.updateMany({
      where: { id: { in: ids }, status: 'PENDING' },
      data: { status: 'SETTLED', settledAt: new Date() },
    });
    const byTenant = targets.reduce((acc: Record<string, { count: number; total: number; ids: string[] }>, t) => {
      const key = t.tenantId;
      if (!acc[key]) acc[key] = { count: 0, total: 0, ids: [] };
      acc[key].count++;
      acc[key].total += Number(t.netAmount);
      acc[key].ids.push(t.id);
      return acc;
    }, {});
    for (const [tenantId, info] of Object.entries(byTenant)) {
      await this.audit.log({
        tenantId,
        userId: actorUserId,
        action: 'SETTLEMENT_BULK_SETTLE',
        entityType: 'SETTLEMENT',
        entityId: `bulk:${info.ids.length}`,
        newValues: { status: 'SETTLED', bulkCount: info.count, totalNet: info.total, settlementIds: info.ids },
      });
    }
    return result;
  }

  /**
   * Super-admin: backfill Settlement records for historical CONFIRMED bookings
   * that don't have a settlement entry yet. Safe to re-run.
   */
  async backfill() {
    const confirmed = await this.prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, tenantId: true, pricePaid: true },
      take: 5000,
    });
    const existing = await this.prisma.settlement.findMany({
      where: { bookingId: { in: confirmed.map((b) => b.id) } },
      select: { bookingId: true },
    });
    const existingIds = new Set(existing.map((s) => s.bookingId));
    const todo = confirmed.filter((b) => !existingIds.has(b.id));

    // Batch-fetch tenant commission rates
    const tenantIds = Array.from(new Set(todo.map((b) => b.tenantId)));
    const tenants = tenantIds.length
      ? await this.prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, commissionRate: true },
        })
      : [];
    const rateById = new Map(tenants.map((t) => [t.id, Number(t.commissionRate) || 0]));

    let created = 0;
    for (const b of todo) {
      const gross = Number(b.pricePaid);
      const rate = rateById.get(b.tenantId) ?? 0;
      const commission = Math.round(gross * rate * 100) / 100;
      const net = Math.round((gross - commission) * 100) / 100;
      try {
        await this.prisma.settlement.create({
          data: {
            tenantId: b.tenantId,
            bookingId: b.id,
            grossAmount: gross,
            commissionAmount: commission,
            netAmount: net,
            commissionRate: rate,
            status: 'PENDING',
          },
        });
        created++;
      } catch { /* unique constraint — skip */ }
    }
    return { created, scanned: todo.length };
  }
}
