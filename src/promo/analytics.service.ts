import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Revenue and booking stats for admin dashboard.
   * Returns: today's revenue, this week, this month, total,
   * plus daily breakdown for the last 30 days.
   */
  async getRevenueStats(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday start
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const where = { trip: { tenantId }, status: 'CONFIRMED' as const };

    const [todayRev, weekRev, monthRev, totalRev, todayCount, totalCount, cancelledCount, dailyRaw] = await Promise.all([
      this.prisma.booking.aggregate({ where: { ...where, bookingTime: { gte: todayStart } }, _sum: { pricePaid: true } }),
      this.prisma.booking.aggregate({ where: { ...where, bookingTime: { gte: weekStart } }, _sum: { pricePaid: true } }),
      this.prisma.booking.aggregate({ where: { ...where, bookingTime: { gte: monthStart } }, _sum: { pricePaid: true } }),
      this.prisma.booking.aggregate({ where, _sum: { pricePaid: true } }),
      this.prisma.booking.count({ where: { ...where, bookingTime: { gte: todayStart } } }),
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { trip: { tenantId }, status: 'CANCELLED' } }),
      // Daily breakdown — raw query for grouping by date
      this.prisma.booking.findMany({
        where: { ...where, bookingTime: { gte: thirtyDaysAgo } },
        select: { pricePaid: true, bookingTime: true },
        orderBy: { bookingTime: 'asc' },
      }),
    ]);

    // Aggregate daily
    const dailyMap = new Map<string, { revenue: number; count: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (29 - i) * 86400000);
      dailyMap.set(d.toISOString().slice(0, 10), { revenue: 0, count: 0 });
    }
    for (const b of dailyRaw) {
      const key = b.bookingTime.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.revenue += Number(b.pricePaid);
        entry.count += 1;
      }
    }

    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      count: data.count,
    }));

    return {
      today: { revenue: Number(todayRev._sum.pricePaid || 0), count: todayCount },
      week: { revenue: Number(weekRev._sum.pricePaid || 0) },
      month: { revenue: Number(monthRev._sum.pricePaid || 0) },
      total: { revenue: Number(totalRev._sum.pricePaid || 0), count: totalCount },
      cancelled: cancelledCount,
      daily,
    };
  }

  /**
   * Comprehensive dashboard data — returns everything needed for the admin overview.
   * Includes revenue trends, hourly sales heatmap, top routes, top drivers,
   * cancellation trends, average ticket price, fleet utilization, booking funnel.
   */
  async getDashboard(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    const whereConfirmed = { trip: { tenantId }, status: 'CONFIRMED' as const };

    const [
      todayAgg, yesterdayAgg, weekAgg, lastWeekAgg, monthAgg, lastMonthAgg,
      totalAgg, cancelledCount, recentBookings,
      hourlyRaw, topRoutesRaw, topDriversRaw,
      vehicleCount, activeVehicleCount, activeTripCount, completedTripCount,
    ] = await Promise.all([
      this.prisma.booking.aggregate({ where: { ...whereConfirmed, bookingTime: { gte: todayStart } }, _sum: { pricePaid: true }, _count: true }),
      this.prisma.booking.aggregate({ where: { ...whereConfirmed, bookingTime: { gte: yesterdayStart, lt: todayStart } }, _sum: { pricePaid: true }, _count: true }),
      this.prisma.booking.aggregate({ where: { ...whereConfirmed, bookingTime: { gte: weekStart } }, _sum: { pricePaid: true }, _count: true }),
      this.prisma.booking.aggregate({ where: { ...whereConfirmed, bookingTime: { gte: lastWeekStart, lt: weekStart } }, _sum: { pricePaid: true }, _count: true }),
      this.prisma.booking.aggregate({ where: { ...whereConfirmed, bookingTime: { gte: monthStart } }, _sum: { pricePaid: true }, _count: true }),
      this.prisma.booking.aggregate({ where: { ...whereConfirmed, bookingTime: { gte: lastMonthStart, lt: monthStart } }, _sum: { pricePaid: true }, _count: true }),
      this.prisma.booking.aggregate({ where: whereConfirmed, _sum: { pricePaid: true }, _count: true }),
      this.prisma.booking.count({ where: { trip: { tenantId }, status: 'CANCELLED', bookingTime: { gte: thirtyDaysAgo } } }),
      this.prisma.booking.findMany({
        where: { ...whereConfirmed, bookingTime: { gte: ninetyDaysAgo } },
        select: { pricePaid: true, bookingTime: true, tripId: true },
        orderBy: { bookingTime: 'asc' },
      }),
      // Hourly pattern for the last 30 days
      this.prisma.booking.findMany({
        where: { ...whereConfirmed, bookingTime: { gte: thirtyDaysAgo } },
        select: { bookingTime: true },
      }),
      // Top routes by bookings (last 30 days)
      this.prisma.booking.groupBy({
        by: ['tripId'],
        where: { ...whereConfirmed, bookingTime: { gte: thirtyDaysAgo } },
        _count: true,
        _sum: { pricePaid: true },
        orderBy: { _count: { tripId: 'desc' } },
        take: 5,
      }),
      // Top drivers (by number of bookings in their trips, last 30 days)
      this.prisma.booking.findMany({
        where: { ...whereConfirmed, bookingTime: { gte: thirtyDaysAgo } },
        select: { trip: { select: { driverId: true, driver: { select: { name: true } } } } },
      }),
      this.prisma.vehicle.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.vehicle.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.trip.count({ where: { tenantId, status: { in: ['PLANNED', 'ACTIVE'] } } }),
      this.prisma.trip.count({ where: { tenantId, status: 'COMPLETED' } }),
    ]);

    // Daily revenue for last 90 days
    const dailyMap = new Map<string, { revenue: number; count: number }>();
    for (let i = 0; i < 90; i++) {
      const d = new Date(now.getTime() - (89 - i) * 86400000);
      dailyMap.set(d.toISOString().slice(0, 10), { revenue: 0, count: 0 });
    }
    for (const b of recentBookings) {
      const key = b.bookingTime.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) { entry.revenue += Number(b.pricePaid); entry.count += 1; }
    }
    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date, revenue: Math.round(data.revenue * 100) / 100, count: data.count,
    }));

    // Hourly heatmap (24 hours x 7 days of week)
    const hourlyMatrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const b of hourlyRaw) {
      const day = b.bookingTime.getDay();
      const hour = b.bookingTime.getHours();
      hourlyMatrix[day][hour]++;
    }

    // Resolve top routes (route info for each tripId)
    const tripIds = topRoutesRaw.map((r) => r.tripId);
    const tripInfos = await this.prisma.trip.findMany({
      where: { id: { in: tripIds } },
      select: { id: true, route: { select: { originStation: { select: { city: true } }, destinationStation: { select: { city: true } } } } },
    });
    const tripInfoMap = new Map(tripInfos.map((t) => [t.id, t.route]));
    const topRoutes = topRoutesRaw.map((r) => {
      const ri = tripInfoMap.get(r.tripId);
      return {
        origin: ri?.originStation.city || '—',
        destination: ri?.destinationStation.city || '—',
        bookings: r._count,
        revenue: Number(r._sum.pricePaid || 0),
      };
    });

    // Top drivers
    const driverCounts = new Map<string, { name: string; count: number }>();
    for (const b of topDriversRaw) {
      const did = b.trip.driverId;
      const name = b.trip.driver?.name || 'Bilinmiyor';
      if (!did) continue;
      const existing = driverCounts.get(did);
      if (existing) existing.count += 1;
      else driverCounts.set(did, { name, count: 1 });
    }
    const topDrivers = Array.from(driverCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Percent change helpers
    const pctChange = (a: number, b: number) => b === 0 ? (a > 0 ? 100 : 0) : Math.round((a - b) / b * 1000) / 10;

    const todayRev = Number(todayAgg._sum.pricePaid || 0);
    const yesterdayRev = Number(yesterdayAgg._sum.pricePaid || 0);
    const weekRev = Number(weekAgg._sum.pricePaid || 0);
    const lastWeekRev = Number(lastWeekAgg._sum.pricePaid || 0);
    const monthRev = Number(monthAgg._sum.pricePaid || 0);
    const lastMonthRev = Number(lastMonthAgg._sum.pricePaid || 0);
    const totalRev = Number(totalAgg._sum.pricePaid || 0);
    const totalBookings = totalAgg._count;
    const monthBookings = monthAgg._count;
    const avgTicketPrice = totalBookings > 0 ? Math.round(totalRev / totalBookings * 100) / 100 : 0;
    const cancellationRate = monthBookings > 0 ? Math.round(cancelledCount / (monthBookings + cancelledCount) * 1000) / 10 : 0;

    return {
      revenue: {
        today: { value: todayRev, count: todayAgg._count, changePct: pctChange(todayRev, yesterdayRev) },
        week: { value: weekRev, count: weekAgg._count, changePct: pctChange(weekRev, lastWeekRev) },
        month: { value: monthRev, count: monthBookings, changePct: pctChange(monthRev, lastMonthRev) },
        total: { value: totalRev, count: totalBookings },
      },
      daily,
      hourlyMatrix,
      topRoutes,
      topDrivers,
      fleet: {
        total: vehicleCount,
        active: activeVehicleCount,
        utilizationPct: vehicleCount > 0 ? Math.round(activeVehicleCount / vehicleCount * 100) : 0,
      },
      trips: {
        active: activeTripCount,
        completed: completedTripCount,
      },
      metrics: {
        avgTicketPrice,
        cancellationRate,
        cancelledCount,
      },
    };
  }

  /**
   * Operational overview — what's happening RIGHT NOW.
   * Today's activity, urgent alerts, pending tasks, recent activity.
   * This is for the admin landing page.
   */
  async getSystemOverview(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const in30days = new Date(now.getTime() + 30 * 86400000);

    // Son 24 saat — driver ops sinyalleri için
    const last24h = new Date(Date.now() - 24 * 3600 * 1000);

    const [
      todayBookings, todayRevenue,
      activeTrips, plannedToday,
      failedRefunds, expiredVehicles, expiringVehicles,
      upcomingTrips, recentLogs,
      openComplaints, urgentComplaints, totalOpenComplaints,
      pendingExpensesCount, recentSosCount, preTripIssuesCount,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: { trip: { tenantId }, status: 'CONFIRMED', bookingTime: { gte: todayStart } },
      }),
      this.prisma.booking.aggregate({
        where: { trip: { tenantId }, status: 'CONFIRMED', bookingTime: { gte: todayStart } },
        _sum: { pricePaid: true },
      }),
      this.prisma.trip.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.trip.count({
        where: {
          tenantId, status: 'PLANNED',
          departureTime: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.booking.count({
        where: {
          trip: { tenantId },
          status: 'CANCELLED',
          refundStatus: 'FAILED',
        },
      }),
      this.prisma.vehicle.findMany({
        where: {
          tenantId, deletedAt: null,
          OR: [
            { muayeneTarihi: { lt: now } },
            { sigortaTarihi: { lt: now } },
          ],
        },
        select: { id: true, registrationPlate: true, muayeneTarihi: true, sigortaTarihi: true },
        take: 5,
      }),
      this.prisma.vehicle.findMany({
        where: {
          tenantId, deletedAt: null,
          OR: [
            { muayeneTarihi: { gte: now, lte: in30days } },
            { sigortaTarihi: { gte: now, lte: in30days } },
          ],
        },
        select: { id: true, registrationPlate: true, muayeneTarihi: true, sigortaTarihi: true },
        take: 5,
      }),
      this.prisma.trip.findMany({
        where: {
          tenantId,
          status: { in: ['PLANNED', 'ACTIVE'] },
          departureTime: { gte: now },
        },
        orderBy: { departureTime: 'asc' },
        take: 6,
        include: {
          route: { include: { originStation: { select: { city: true } }, destinationStation: { select: { city: true } } } },
          vehicle: { select: { registrationPlate: true } },
          driver: { select: { name: true } },
          _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
        },
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { timestamp: 'desc' },
        take: 8,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.complaint.findMany({
        where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, subject: true, category: true, priority: true,
          status: true, createdAt: true, contactName: true,
        },
      }),
      this.prisma.complaint.count({
        where: {
          tenantId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          priority: { in: ['HIGH', 'URGENT'] },
        },
      }),
      this.prisma.complaint.count({
        where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      // Şoför operasyonları — son 24 saat driver ops sinyalleri
      (this.prisma as any).driverExpense.count({
        where: { tenantId, status: 'PENDING' },
      }),
      this.prisma.auditLog.count({
        where: { tenantId, action: 'SOS_TRIGGER' as any, timestamp: { gte: last24h } },
      }),
      (this.prisma as any).preTripCheck.count({
        where: { trip: { tenantId }, hasIssue: true, createdAt: { gte: last24h } },
      }),
    ]);

    return {
      today: {
        bookings: todayBookings,
        revenue: Number(todayRevenue._sum.pricePaid || 0),
      },
      trips: {
        active: activeTrips,
        plannedToday,
      },
      alerts: {
        failedRefunds,
        expiredVehicles: expiredVehicles.map(v => ({
          id: v.id, plate: v.registrationPlate,
          muayeneExpired: v.muayeneTarihi && v.muayeneTarihi < now,
          sigortaExpired: v.sigortaTarihi && v.sigortaTarihi < now,
        })),
        expiringVehicles: expiringVehicles.map(v => ({
          id: v.id, plate: v.registrationPlate,
          muayene: v.muayeneTarihi, sigorta: v.sigortaTarihi,
        })),
        openComplaintsCount: totalOpenComplaints,
        urgentComplaintsCount: urgentComplaints,
        recentComplaints: openComplaints.map(c => ({
          id: c.id,
          subject: c.subject,
          category: c.category,
          priority: c.priority,
          status: c.status,
          contactName: c.contactName,
          createdAt: c.createdAt,
        })),
        // Şoför operasyonları — admin takip ekranı
        pendingExpensesCount,
        recentSosCount,
        preTripIssuesCount,
      },
      upcomingTrips: upcomingTrips.map(t => ({
        id: t.id,
        origin: t.route.originStation.city,
        destination: t.route.destinationStation.city,
        departureTime: t.departureTime,
        plate: t.vehicle.registrationPlate,
        driver: t.driver?.name || null,
        status: t.status,
        bookings: t._count.bookings,
      })),
      recentActivity: recentLogs.map(l => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        userName: l.user?.name || null,
        timestamp: l.timestamp,
      })),
    };
  }

  /**
   * VAT/tax breakdown for the current month.
   * Turkish bus tickets are subject to 20% VAT (as of 2024+).
   */
  async getTaxReport(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const VAT_RATE = 0.20;

    const [month, year] = await Promise.all([
      this.prisma.booking.aggregate({
        where: { trip: { tenantId }, status: 'CONFIRMED', bookingTime: { gte: monthStart } },
        _sum: { pricePaid: true },
        _count: true,
      }),
      this.prisma.booking.aggregate({
        where: { trip: { tenantId }, status: 'CONFIRMED', bookingTime: { gte: yearStart } },
        _sum: { pricePaid: true },
        _count: true,
      }),
    ]);

    const monthGross = Number(month._sum.pricePaid || 0);
    const yearGross = Number(year._sum.pricePaid || 0);
    // Gross = Net × (1 + VAT_RATE); Net = Gross / 1.20; VAT = Gross - Net
    const monthNet = monthGross / (1 + VAT_RATE);
    const yearNet = yearGross / (1 + VAT_RATE);

    return {
      vatRate: VAT_RATE,
      month: {
        gross: Math.round(monthGross * 100) / 100,
        net: Math.round(monthNet * 100) / 100,
        vat: Math.round((monthGross - monthNet) * 100) / 100,
        bookings: month._count,
      },
      year: {
        gross: Math.round(yearGross * 100) / 100,
        net: Math.round(yearNet * 100) / 100,
        vat: Math.round((yearGross - yearNet) * 100) / 100,
        bookings: year._count,
      },
    };
  }

  /**
   * Route occupancy stats — which routes are most popular.
   */
  async getOccupancyStats(tenantId: string) {
    const routes = await this.prisma.route.findMany({
      where: { tenantId },
      include: {
        originStation: { select: { city: true } },
        destinationStation: { select: { city: true } },
        _count: { select: { trips: true } },
      },
    });

    const routeStats = await Promise.all(
      routes.map(async (r) => {
        const bookings = await this.prisma.booking.count({
          where: { trip: { routeId: r.id }, status: 'CONFIRMED' },
        });
        return {
          routeId: r.id,
          origin: r.originStation.city,
          destination: r.destinationStation.city,
          tripCount: r._count.trips,
          bookingCount: bookings,
        };
      }),
    );

    return routeStats.sort((a, b) => b.bookingCount - a.bookingCount);
  }
}
