import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';

@Injectable()
export class DriverOpsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Returns trips relevant to the driver right now:
   * - Any ACTIVE trip (currently on the road)
   * - PLANNED trips departing in next 7 days
   * - COMPLETED trips from today (recent history)
   */
  async getTodayTrips(tenantId: string, driverId: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return this.prisma.trip.findMany({
      where: {
        tenantId,
        driverId,
        OR: [
          { status: 'ACTIVE' },
          { status: 'PLANNED', departureTime: { gte: startOfToday, lt: endOfWeek } },
          { status: 'COMPLETED', departureTime: { gte: startOfToday } },
        ],
      },
      include: {
        route: {
          include: {
            originStation: { select: { name: true, city: true } },
            destinationStation: { select: { name: true, city: true } },
          },
        },
        vehicle: true,
      },
      orderBy: [
        { departureTime: 'asc' },
      ],
    });
  }

  async updateTripStatus(tenantId: string, driverId: string, tripId: string, updateTripStatusDto: UpdateTripStatusDto) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
        driverId,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found or not assigned to you`);
    }

    // Vardiya takibi: şoför sefer başlatınca/bitirince zaman damgası yaz.
    // İlk ACTIVE geçişte driverStartedAt, COMPLETED geçişte driverCompletedAt.
    const data: any = { status: updateTripStatusDto.status };
    if (updateTripStatusDto.status === 'ACTIVE' && !(trip as any).driverStartedAt) {
      data.driverStartedAt = new Date();
    }
    if (updateTripStatusDto.status === 'COMPLETED' && !(trip as any).driverCompletedAt) {
      data.driverCompletedAt = new Date();
      data.actualArrival = new Date();
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data,
    });

    // COMPLETED'e geçtiyse post-trip özet e-postasını fire-and-forget gönder.
    // (Cron'daki otomatik COMPLETED'te de no-show email ayrı gider — onunla çakışmaz.)
    if (updateTripStatusDto.status === 'COMPLETED' && trip.status !== 'COMPLETED') {
      this.sendPostTripSummary(tripId).catch((err: any) => {
        console.error(`[PostTripSummary] ${tripId}: ${err?.message || err}`);
      });
    }

    return updated;
  }

  /**
   * Sefer tamamlandığında firma admin'e otomatik özet e-postası.
   * İçerik: kaç yolcu bindi, kaç no-show, kaç masraf, vardiya süresi, varsa olay.
   */
  // ═════════════════════════════════════════════════════════════
  // Admin: expense moderation + SOS log + pre-trip issues
  // ═════════════════════════════════════════════════════════════

  /**
   * Bir olayı (SOS veya pre-trip) çözüldü / yanlış alarm olarak işaretle.
   * IncidentResolution tablosunda tekil kayıt (unique constraint).
   */
  async resolveIncident(
    tenantId: string,
    reviewerId: string,
    args: {
      referenceType: 'SOS' | 'PRE_TRIP';
      referenceId: string;
      status?: 'RESOLVED' | 'FALSE_ALARM' | 'ACKNOWLEDGED';
      note: string;
    },
  ) {
    if (!args.note || args.note.trim().length < 3) {
      throw new ForbiddenException('Çözüm notu zorunlu (en az 3 karakter) — sorumluluk izi için');
    }
    if (!['SOS', 'PRE_TRIP'].includes(args.referenceType)) {
      throw new ForbiddenException('Geçersiz olay türü');
    }

    const resolution = await (this.prisma as any).incidentResolution.upsert({
      where: {
        referenceType_referenceId: {
          referenceType: args.referenceType,
          referenceId: args.referenceId,
        },
      },
      create: {
        tenantId,
        referenceType: args.referenceType,
        referenceId: args.referenceId,
        status: args.status || 'RESOLVED',
        resolutionNote: args.note.trim(),
        resolvedBy: reviewerId,
      },
      update: {
        status: args.status || 'RESOLVED',
        resolutionNote: args.note.trim(),
        resolvedBy: reviewerId,
        resolvedAt: new Date(),
      },
    });

    await this.audit.log({
      tenantId, userId: reviewerId,
      action: 'UPDATE' as any,
      entityType: 'TRIP',
      entityId: args.referenceId,
      newValues: { referenceType: args.referenceType, status: resolution.status, note: args.note },
    });

    return resolution;
  }

  async reopenIncident(tenantId: string, referenceType: 'SOS' | 'PRE_TRIP', referenceId: string) {
    await (this.prisma as any).incidentResolution.deleteMany({
      where: { tenantId, referenceType, referenceId },
    });
    return { success: true };
  }

  /**
   * Firma admin için bekleyen + geçmiş masraflar listesi.
   * Trip, şoför ve kategori bilgisiyle birlikte dönülür.
   */
  async adminListExpenses(tenantId: string, opts: { status?: string; take?: number; skip?: number } = {}) {
    const { status, take = 100, skip = 0 } = opts;
    const where: any = { tenantId };
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) where.status = status;

    const [items, total, stats] = await Promise.all([
      (this.prisma as any).driverExpense.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
      }),
      (this.prisma as any).driverExpense.count({ where }),
      (this.prisma as any).driverExpense.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    // Batch-enrich: driver + trip route
    const driverIds = Array.from(new Set(items.map((e: any) => e.driverId)));
    const tripIds = Array.from(new Set(items.map((e: any) => e.tripId)));
    const [drivers, trips] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, name: true },
      }),
      this.prisma.trip.findMany({
        where: { id: { in: tripIds } },
        select: {
          id: true, departureTime: true,
          vehicle: { select: { registrationPlate: true } },
          route: {
            select: {
              originStation: { select: { city: true } },
              destinationStation: { select: { city: true } },
            },
          },
        },
      }),
    ]);
    const driverMap = new Map(drivers.map((d) => [d.id, d]));
    const tripMap = new Map(trips.map((t) => [t.id, t]));

    const statsMap = stats.reduce((acc: any, s: any) => {
      acc[s.status] = { count: s._count._all, total: Number(s._sum.amount || 0) };
      return acc;
    }, {});

    return {
      items: items.map((e: any) => ({
        ...e,
        amount: Number(e.amount),
        driver: driverMap.get(e.driverId) || null,
        trip: tripMap.get(e.tripId) ? {
          id: e.tripId,
          departureTime: tripMap.get(e.tripId)!.departureTime,
          plate: tripMap.get(e.tripId)!.vehicle.registrationPlate,
          route: `${tripMap.get(e.tripId)!.route.originStation.city} → ${tripMap.get(e.tripId)!.route.destinationStation.city}`,
        } : null,
      })),
      total,
      stats: {
        pending: statsMap.PENDING || { count: 0, total: 0 },
        approved: statsMap.APPROVED || { count: 0, total: 0 },
        rejected: statsMap.REJECTED || { count: 0, total: 0 },
      },
    };
  }

  /** Firma admin: masrafı onayla/reddet. Status PENDING'de olmalı. */
  async adminReviewExpense(
    tenantId: string,
    reviewerId: string,
    expenseId: string,
    action: 'APPROVE' | 'REJECT',
    note?: string,
  ) {
    const expense = await (this.prisma as any).driverExpense.findFirst({
      where: { id: expenseId, tenantId },
    });
    if (!expense) throw new NotFoundException('Masraf bulunamadı');
    if (expense.status !== 'PENDING') {
      throw new ForbiddenException(`Bu masraf zaten ${expense.status === 'APPROVED' ? 'onaylanmış' : 'reddedilmiş'}`);
    }

    const updated = await (this.prisma as any).driverExpense.update({
      where: { id: expenseId },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    });

    await this.audit.log({
      tenantId, userId: reviewerId,
      action: 'UPDATE' as any,
      entityType: 'TRIP', entityId: expense.tripId,
      newValues: { expenseId, status: updated.status, amount: Number(expense.amount), reviewNote: note },
    });

    return updated;
  }

  /**
   * Firma admin: son tetiklenen SOS olaylarının listesi (audit log üzerinden).
   * Konum, kategori, not, şoför, sefer bilgisi derlenir.
   */
  async adminListSosEvents(tenantId: string, opts: { take?: number; skip?: number; onlyOpen?: boolean } = {}) {
    const { take = 50, skip = 0, onlyOpen } = opts;
    const events = await this.prisma.auditLog.findMany({
      where: { tenantId, action: 'SOS_TRIGGER' as any },
      orderBy: { timestamp: 'desc' },
      take, skip,
      select: {
        id: true, entityId: true, timestamp: true, newValues: true,
        user: { select: { id: true, name: true, phoneNumber: true } },
      },
    });

    // Batch-fetch resolutions
    const eventIds = events.map((e) => e.id);
    const resolutions = eventIds.length
      ? await (this.prisma as any).incidentResolution.findMany({
          where: { tenantId, referenceType: 'SOS', referenceId: { in: eventIds } },
        })
      : [];
    const resolverIds = resolutions.map((r: any) => r.resolvedBy);
    const resolvers = resolverIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: resolverIds } },
          select: { id: true, name: true },
        })
      : [];
    const resolverMap = new Map(resolvers.map((u) => [u.id, u]));
    const resMap = new Map(resolutions.map((r: any) => [r.referenceId, {
      ...r,
      resolver: resolverMap.get(r.resolvedBy) || null,
    }]));

    let items = events.map((e) => ({
      id: e.id,
      tripId: e.entityId,
      timestamp: e.timestamp,
      driver: e.user,
      details: e.newValues,
      resolution: resMap.get(e.id) || null,
    }));

    if (onlyOpen) items = items.filter((i) => !i.resolution);

    const total = await this.prisma.auditLog.count({
      where: { tenantId, action: 'SOS_TRIGGER' as any },
    });
    const openCount = items.filter((i) => !i.resolution).length;

    return { items, total, openCount };
  }

  /**
   * Firma admin: son pre-trip kontrol raporları (eksik raporlananlar öncelikli).
   */
  async adminListPreTripChecks(tenantId: string, opts: { hasIssue?: boolean; take?: number; skip?: number } = {}) {
    const { hasIssue, take = 50, skip = 0 } = opts;
    const where: any = {
      trip: { tenantId },
    };
    if (hasIssue !== undefined) where.hasIssue = hasIssue;

    const [items, total] = await Promise.all([
      (this.prisma as any).preTripCheck.findMany({
        where,
        orderBy: [{ hasIssue: 'desc' }, { createdAt: 'desc' }],
        skip, take,
      }),
      (this.prisma as any).preTripCheck.count({ where }),
    ]);

    // Batch enrich driver + trip + resolution
    const driverIds = Array.from(new Set(items.map((c: any) => c.driverId)));
    const tripIds = Array.from(new Set(items.map((c: any) => c.tripId)));
    const checkIds = items.map((c: any) => c.id);
    const [drivers, trips, resolutions] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, name: true },
      }),
      this.prisma.trip.findMany({
        where: { id: { in: tripIds } },
        select: {
          id: true, departureTime: true,
          vehicle: { select: { registrationPlate: true } },
          route: {
            select: {
              originStation: { select: { city: true } },
              destinationStation: { select: { city: true } },
            },
          },
        },
      }),
      checkIds.length
        ? (this.prisma as any).incidentResolution.findMany({
            where: { tenantId, referenceType: 'PRE_TRIP', referenceId: { in: checkIds } },
          })
        : [],
    ]);
    const driverMap = new Map(drivers.map((d) => [d.id, d]));
    const tripMap = new Map(trips.map((t) => [t.id, t]));
    const resolverIds = resolutions.map((r: any) => r.resolvedBy);
    const resolvers = resolverIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: resolverIds } },
          select: { id: true, name: true },
        })
      : [];
    const resolverMap = new Map(resolvers.map((u) => [u.id, u]));
    const resMap = new Map(resolutions.map((r: any) => [r.referenceId, {
      ...r,
      resolver: resolverMap.get(r.resolvedBy) || null,
    }]));

    return {
      items: items.map((c: any) => ({
        ...c,
        driver: driverMap.get(c.driverId) || null,
        trip: tripMap.get(c.tripId) ? {
          id: c.tripId,
          departureTime: tripMap.get(c.tripId)!.departureTime,
          plate: tripMap.get(c.tripId)!.vehicle.registrationPlate,
          route: `${tripMap.get(c.tripId)!.route.originStation.city} → ${tripMap.get(c.tripId)!.route.destinationStation.city}`,
        } : null,
        resolution: resMap.get(c.id) || null,
      })),
      total,
    };
  }

  // ═════════════════════════════════════════════════════════════
  // Driver Profile & Documents (şoförün kendi profili)
  // ═════════════════════════════════════════════════════════════

  /** Şoförün kendi profilini getir — yoksa varsayılanlarla oluştur. */
  async getMyProfile(tenantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phoneNumber: true, avatarUrl: true,
        role: true, createdAt: true, totalTrips: true, badges: true,
      },
    });
    if (!user) throw new NotFoundException();

    let profile = await (this.prisma as any).driverProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await (this.prisma as any).driverProfile.create({
        data: { userId, tenantId },
      });
    }

    const [documents, completedTrips, avgRating] = await Promise.all([
      (this.prisma as any).driverDocument.findMany({
        where: { userId },
        orderBy: { validUntil: 'asc' },
      }),
      this.prisma.trip.count({ where: { driverId: userId, status: 'COMPLETED' } }),
      this.prisma.review.aggregate({
        where: { driverId: userId, hidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    return {
      user,
      profile,
      documents,
      stats: {
        completedTrips,
        averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating) : null,
        reviewCount: avgRating._count._all,
      },
    };
  }

  async updateMyProfile(
    tenantId: string,
    userId: string,
    data: {
      dateOfBirth?: string | null;
      bloodType?: string | null;
      emergencyContactName?: string | null;
      emergencyContactPhone?: string | null;
      emergencyContactRelation?: string | null;
      address?: string | null;
      city?: string | null;
      shirtSize?: string | null;
      language?: string;
      notifyEmail?: boolean;
      notifySms?: boolean;
      notifyPush?: boolean;
    },
  ) {
    const update: any = {};
    const fields: (keyof typeof data)[] = [
      'dateOfBirth', 'bloodType', 'emergencyContactName', 'emergencyContactPhone',
      'emergencyContactRelation', 'address', 'city', 'shirtSize', 'language',
      'notifyEmail', 'notifySms', 'notifyPush',
    ];
    for (const k of fields) {
      if (data[k] !== undefined) {
        update[k] = k === 'dateOfBirth' && data[k] ? new Date(data[k] as string) : data[k];
      }
    }

    return (this.prisma as any).driverProfile.upsert({
      where: { userId },
      create: { userId, tenantId, ...update },
      update,
    });
  }

  async upsertDocument(
    tenantId: string,
    userId: string,
    data: {
      type: string;
      documentNumber?: string;
      licenseClass?: string;
      issuedAt?: string;
      validUntil?: string;
      note?: string;
    },
  ) {
    const validTypes = ['LICENSE', 'SRC1', 'SRC2', 'SRC3', 'SRC4', 'PSYCHOTECH', 'HEALTH_REPORT', 'CRIMINAL_RECORD'];
    if (!validTypes.includes(data.type)) {
      throw new ForbiddenException(`Geçersiz belge tipi. Geçerli: ${validTypes.join(', ')}`);
    }
    return (this.prisma as any).driverDocument.upsert({
      where: { userId_type: { userId, type: data.type } },
      create: {
        userId, tenantId, type: data.type,
        documentNumber: data.documentNumber || null,
        licenseClass: data.licenseClass || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        note: data.note || null,
      },
      update: {
        documentNumber: data.documentNumber || null,
        licenseClass: data.licenseClass || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        note: data.note || null,
      },
    });
  }

  async deleteDocument(userId: string, documentId: string) {
    const doc = await (this.prisma as any).driverDocument.findFirst({
      where: { id: documentId, userId },
    });
    if (!doc) throw new NotFoundException();
    await (this.prisma as any).driverDocument.delete({ where: { id: documentId } });
    return { success: true };
  }

  /**
   * Admin: şoförün tam 360° profili — admin panelinde "Detay" butonundan açılır.
   * Diğer DRIVER kullanıcıların profilini admin-only olarak okur.
   */
  async adminGetDriverProfile(tenantId: string, driverId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: driverId, tenantId, role: 'DRIVER' },
      select: {
        id: true, name: true, email: true, phoneNumber: true, avatarUrl: true,
        role: true, createdAt: true, totalTrips: true, badges: true,
        suspendedAt: true, suspendedReason: true,
      },
    });
    if (!user) throw new NotFoundException('Şoför bulunamadı');

    const [profile, documents, completedTrips, ratingAgg, recentTrips, sosCount, expenseAgg, preTripCount, preTripIssueCount, reviews] = await Promise.all([
      (this.prisma as any).driverProfile.findUnique({ where: { userId: driverId } }),
      (this.prisma as any).driverDocument.findMany({
        where: { userId: driverId }, orderBy: { validUntil: 'asc' },
      }),
      this.prisma.trip.count({ where: { driverId, status: 'COMPLETED' } }),
      this.prisma.review.aggregate({
        where: { driverId, hidden: false },
        _avg: { rating: true }, _count: { _all: true },
      }),
      this.prisma.trip.findMany({
        where: { driverId, tenantId },
        orderBy: { departureTime: 'desc' },
        take: 10,
        include: {
          vehicle: { select: { registrationPlate: true } },
          route: {
            select: {
              originStation: { select: { city: true } },
              destinationStation: { select: { city: true } },
            },
          },
          _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
        },
      }),
      this.prisma.auditLog.count({
        where: { tenantId, userId: driverId, action: 'SOS_TRIGGER' as any },
      }),
      (this.prisma as any).driverExpense.aggregate({
        where: { tenantId, driverId },
        _sum: { amount: true }, _count: { _all: true },
      }),
      (this.prisma as any).preTripCheck.count({ where: { driverId } }),
      (this.prisma as any).preTripCheck.count({ where: { driverId, hasIssue: true } }),
      this.prisma.review.findMany({
        where: { driverId, hidden: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      user,
      profile: profile || null,
      documents,
      stats: {
        completedTrips,
        averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating) : null,
        reviewCount: ratingAgg._count._all,
        sosCount,
        totalExpenseCount: expenseAgg._count._all,
        totalExpenseAmount: Number(expenseAgg._sum.amount || 0),
        preTripCount,
        preTripIssueCount,
        preTripComplianceRate: preTripCount > 0 ? Math.round(((preTripCount - preTripIssueCount) / preTripCount) * 100) : null,
      },
      recentTrips: recentTrips.map((t) => ({
        id: t.id,
        departureTime: t.departureTime,
        status: t.status,
        plate: t.vehicle.registrationPlate,
        route: `${t.route.originStation.city} → ${t.route.destinationStation.city}`,
        passengers: t._count.bookings,
      })),
      recentReviews: reviews,
    };
  }

  async sendPostTripSummary(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: { include: { originStation: true, destinationStation: true } },
        vehicle: { select: { registrationPlate: true } },
        driver: { select: { name: true } },
        bookings: { select: { boardingStatus: true } },
      },
    });
    if (!trip) return;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: trip.tenantId },
      select: { supportEmail: true, publicName: true, name: true },
    });
    if (!tenant?.supportEmail) return;

    const boarded = trip.bookings.filter((b) => b.boardingStatus === 'BOARDED').length;
    const noShow = trip.bookings.filter((b) => b.boardingStatus === 'NO_SHOW').length;
    const pending = trip.bookings.filter((b) => b.boardingStatus === 'PENDING').length;
    const total = trip.bookings.length;

    const [expenses, sosEvents, preCheck] = await Promise.all([
      (this.prisma as any).driverExpense.findMany({ where: { tripId }, select: { amount: true, category: true } }),
      this.prisma.auditLog.count({
        where: { entityType: 'TRIP', entityId: tripId, action: 'SOS_TRIGGER' as any },
      }),
      (this.prisma as any).preTripCheck.findUnique({ where: { tripId } }),
    ]);
    const expenseTotal = expenses.reduce((s: number, x: any) => s + Number(x.amount), 0);

    const durationMs = (trip as any).driverCompletedAt && (trip as any).driverStartedAt
      ? new Date((trip as any).driverCompletedAt).getTime() - new Date((trip as any).driverStartedAt).getTime()
      : 0;
    const durationStr = durationMs > 0
      ? `${Math.floor(durationMs / 3600000)}s ${Math.floor((durationMs % 3600000) / 60000)}dk`
      : 'Bilinmiyor';

    await this.notifications.sendPostTripSummary(tenant.supportEmail, {
      route: `${trip.route.originStation.city} → ${trip.route.destinationStation.city}`,
      vehiclePlate: trip.vehicle.registrationPlate,
      driverName: trip.driver?.name || 'Bilinmiyor',
      departureTime: trip.departureTime,
      duration: durationStr,
      totalPassengers: total,
      boarded, noShow, pending,
      expenseTotal,
      expenseCount: expenses.length,
      sosCount: sosEvents,
      preTripHadIssue: preCheck?.hasIssue || false,
    }).catch((err: any) => console.error(`[PostTrip email] ${err?.message}`));
  }

  async logLocation(tenantId: string, driverId: string, tripId: string, locationDto: LocationDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
    });

    if (!trip) {
      throw new ForbiddenException(`You are not authorized to log location for trip ${tripId}`);
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        currentLat: locationDto.latitude,
        currentLng: locationDto.longitude,
        currentSpeed: (locationDto as any).speed ?? null,
        lastLocationAt: new Date(),
      },
    });

    return {
      success: true,
      timestamp: updated.lastLocationAt,
      lat: updated.currentLat,
      lng: updated.currentLng,
    };
  }

  /**
   * Full passenger manifest for a trip. Driver can see all bookings + boarding status.
   */
  async getManifest(tenantId: string, driverId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
      include: {
        route: {
          include: {
            originStation: { select: { name: true, city: true } },
            destinationStation: { select: { name: true, city: true } },
          },
        },
        vehicle: { select: { registrationPlate: true, model: true, capacity: true, layoutType: true } },
      },
    });
    if (!trip) throw new ForbiddenException('Bu seferi görmeye yetkin yok');

    const bookings = await this.prisma.booking.findMany({
      where: { tripId, status: 'CONFIRMED' },
      include: {
        seat: { select: { seatNumber: true, type: true } },
      },
      orderBy: { seat: { seatNumber: 'asc' } },
    });

    const stats = {
      total: bookings.length,
      boarded: bookings.filter((b) => b.boardingStatus === 'BOARDED').length,
      pending: bookings.filter((b) => b.boardingStatus === 'PENDING').length,
      noShow: bookings.filter((b) => b.boardingStatus === 'NO_SHOW').length,
    };

    return {
      trip: {
        id: trip.id,
        status: trip.status,
        departureTime: trip.departureTime,
        estimatedArrival: trip.estimatedArrival,
        origin: trip.route.originStation,
        destination: trip.route.destinationStation,
        vehicle: trip.vehicle,
      },
      stats,
      passengers: bookings.map((b) => ({
        bookingId: b.id,
        pnrCode: b.pnrCode,
        passengerName: b.passengerName,
        passengerTcNo: b.passengerTcNo,
        contactPhone: b.contactPhone,
        seatNumber: b.seat.seatNumber,
        seatType: b.seat.type,
        pricePaid: Number(b.pricePaid),
        boardingStatus: b.boardingStatus,
        boardedAt: b.boardedAt,
      })),
    };
  }

  /**
   * Check-in a passenger by PNR or booking ID.
   * Verifies the driver owns the trip and the PNR belongs to it.
   */
  async checkInPassenger(tenantId: string, driverId: string, pnr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode: pnr.toUpperCase() },
      include: { trip: true },
    });

    if (!booking) throw new NotFoundException('PNR bulunamadı');
    if (booking.trip.tenantId !== tenantId || booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Bu PNR sana ait bir sefere değil');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new ForbiddenException('Bu bilet iptal edilmiş veya geçersiz');
    }

    if (booking.boardingStatus === 'BOARDED') {
      return { alreadyBoarded: true, at: booking.boardedAt, booking };
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        boardingStatus: 'BOARDED',
        boardedAt: new Date(),
        boardedBy: driverId,
      },
      include: { seat: { select: { seatNumber: true } } },
    });

    this.audit.log({
      tenantId, userId: driverId,
      action: 'PASSENGER_CHECK_IN',
      entityType: 'BOOKING', entityId: booking.id,
      newValues: { pnr: updated.pnrCode, seatNumber: updated.seat.seatNumber },
    });

    return {
      alreadyBoarded: false,
      pnr: updated.pnrCode,
      passengerName: updated.passengerName,
      seatNumber: updated.seat.seatNumber,
      boardedAt: updated.boardedAt,
    };
  }

  /**
   * Mark a passenger as NO_SHOW (didn't board).
   */
  async markNoShow(tenantId: string, driverId: string, pnr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode: pnr.toUpperCase() },
      include: { trip: true },
    });
    if (!booking) throw new NotFoundException('PNR bulunamadı');
    if (booking.trip.tenantId !== tenantId || booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Bu PNR sana ait bir sefere değil');
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { boardingStatus: 'NO_SHOW' },
    });

    this.audit.log({
      tenantId, userId: driverId,
      action: 'PASSENGER_NO_SHOW',
      entityType: 'BOOKING', entityId: booking.id,
      newValues: { pnr: updated.pnrCode },
    });

    return updated;
  }

  /**
   * Undo a boarding action (revert to PENDING).
   */
  async resetBoardingStatus(tenantId: string, driverId: string, pnr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode: pnr.toUpperCase() },
      include: { trip: true },
    });
    if (!booking) throw new NotFoundException('PNR bulunamadı');
    if (booking.trip.tenantId !== tenantId || booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Bu PNR sana ait bir sefere değil');
    }

    return this.prisma.booking.update({
      where: { id: booking.id },
      data: { boardingStatus: 'PENDING', boardedAt: null, boardedBy: null },
    });
  }

  async createExpense(tenantId: string, driverId: string, tripId: string, createExpenseDto: CreateExpenseDto) {
    // Ensure trip belongs to driver and tenant
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
        driverId,
      },
    });

    if (!trip) {
      throw new ForbiddenException(`You are not authorized to submit expenses for trip ${tripId}`);
    }

    const { category, amount, description } = createExpenseDto;
    const validCategories = ['FUEL', 'TOLL', 'FOOD', 'PARKING', 'OTHER'];
    if (!validCategories.includes(category)) {
      throw new ForbiddenException(`Geçersiz kategori. Geçerli: ${validCategories.join(', ')}`);
    }
    if (!amount || amount <= 0) {
      throw new ForbiddenException('Tutar pozitif olmalı');
    }

    const expense = await (this.prisma as any).driverExpense.create({
      data: {
        tenantId, tripId, driverId,
        category, amount, description: description || null,
        status: 'PENDING',
      },
    });

    await this.audit.log({
      tenantId, userId: driverId,
      action: 'EXPENSE_CREATE' as any,
      entityType: 'TRIP', entityId: tripId,
      newValues: { expenseId: expense.id, category, amount, description },
    });

    return expense;
  }

  async listExpensesForTrip(tenantId: string, driverId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
    });
    if (!trip) throw new ForbiddenException('Yetkisiz erişim');
    return (this.prisma as any).driverExpense.findMany({
      where: { tripId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteExpense(tenantId: string, driverId: string, expenseId: string) {
    // Şoför sadece kendi kaydını ve PENDING durumunda silebilir
    const expense = await (this.prisma as any).driverExpense.findFirst({
      where: { id: expenseId, tenantId, driverId, status: 'PENDING' },
    });
    if (!expense) throw new ForbiddenException('Bu masrafı silme yetkin yok (onaylanmış ya da başkasının)');
    await (this.prisma as any).driverExpense.delete({ where: { id: expenseId } });
    await this.audit.log({
      tenantId, userId: driverId,
      action: 'EXPENSE_DELETE' as any,
      entityType: 'TRIP', entityId: expense.tripId,
      oldValues: { expenseId, category: expense.category, amount: expense.amount },
    });
    return { success: true };
  }

  /**
   * SOS: şoför mid-trip acil durum (kaza/sağlık/arıza/güvenlik).
   * Audit log'a kritik kayıt + firma destek telefonunu döner ki
   * şoför tek tık arayabilsin. Mail ile admin'e de alert gönderilir.
   */
  async triggerSos(
    tenantId: string,
    driverId: string,
    tripId: string,
    payload: { category?: string; note?: string; lat?: number; lng?: number },
  ) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
      include: {
        route: { include: { originStation: true, destinationStation: true } },
        vehicle: { select: { registrationPlate: true } },
      },
    });
    if (!trip) throw new ForbiddenException('Bu sefere SOS tetikleme yetkin yok');

    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
      select: { name: true, phoneNumber: true },
    });
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { supportPhone: true, supportEmail: true, name: true, publicName: true },
    });

    const category = payload.category || 'OTHER';
    const label: Record<string, string> = {
      ACCIDENT: 'Kaza',
      MEDICAL: 'Sağlık',
      MECHANICAL: 'Arıza',
      SECURITY: 'Güvenlik',
      OTHER: 'Diğer',
    };
    const categoryLabel = label[category] || 'Diğer';

    // Audit log — kritik kayıt
    await this.audit.log({
      tenantId,
      userId: driverId,
      action: 'SOS_TRIGGER' as any,
      entityType: 'TRIP',
      entityId: tripId,
      newValues: {
        category,
        note: payload.note || null,
        lat: payload.lat || null,
        lng: payload.lng || null,
        driver: driver?.name,
        vehicle: trip.vehicle.registrationPlate,
        route: `${trip.route.originStation.city} → ${trip.route.destinationStation.city}`,
      },
    });

    // Admin'e e-posta at (fire-and-forget)
    if (tenant?.supportEmail) {
      this.notifications.sendDriverSosAlert(tenant.supportEmail, {
        driverName: driver?.name || 'Bilinmiyor',
        vehiclePlate: trip.vehicle.registrationPlate,
        route: `${trip.route.originStation.city} → ${trip.route.destinationStation.city}`,
        category: categoryLabel,
        note: payload.note,
        lat: payload.lat,
        lng: payload.lng,
        tripId,
      }).catch((err: any) => {
        console.error(`[SOS] Email failed: ${err?.message || err}`);
      });
    }

    return {
      success: true,
      supportPhone: tenant?.supportPhone || null,
      supportEmail: tenant?.supportEmail || null,
      message: `${categoryLabel} bildirimi alındı. Destek ekibi bilgilendirildi.`,
    };
  }

  /** Pre-trip inspection kaydı varsa dön, yoksa null. */
  async getPreTripCheck(tenantId: string, driverId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
    });
    if (!trip) throw new ForbiddenException('Yetkisiz erişim');
    return (this.prisma as any).preTripCheck.findUnique({ where: { tripId } });
  }

  /**
   * Şoför sefer öncesi kontrol formunu doldurur.
   * Herhangi bir kontrol FALSE ise hasIssue=true olur ve firma admin'e e-posta gider.
   * Audit log'a da yazılır (sigorta/olay sonrası referans).
   */
  async submitPreTripCheck(
    tenantId: string,
    driverId: string,
    tripId: string,
    payload: {
      fuelOk: boolean; tiresOk: boolean; brakesOk: boolean; lightsOk: boolean;
      hornOk: boolean; wipersOk: boolean; mirrorsOk: boolean; seatbeltsOk: boolean;
      acOk: boolean; cleanInside: boolean; extinguisherOk: boolean;
      firstAidOk: boolean; emergencyHammerOk: boolean;
      odometerKm?: number; fuelLevelPercent?: number; issueNote?: string;
    },
  ) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId, driverId },
      include: {
        vehicle: { select: { registrationPlate: true } },
        route: { include: { originStation: true, destinationStation: true } },
      },
    });
    if (!trip) throw new ForbiddenException('Bu sefer için kontrol formu dolduramazsın');

    // Kontrol listesindeki tüm boolean değerleri tara — herhangi biri false ise sorun var
    const checks = [
      payload.fuelOk, payload.tiresOk, payload.brakesOk, payload.lightsOk,
      payload.hornOk, payload.wipersOk, payload.mirrorsOk, payload.seatbeltsOk,
      payload.acOk, payload.cleanInside, payload.extinguisherOk,
      payload.firstAidOk, payload.emergencyHammerOk,
    ];
    const hasIssue = checks.some((v) => v === false);

    const saved = await (this.prisma as any).preTripCheck.upsert({
      where: { tripId },
      create: {
        tripId, driverId,
        fuelOk: payload.fuelOk, tiresOk: payload.tiresOk, brakesOk: payload.brakesOk,
        lightsOk: payload.lightsOk, hornOk: payload.hornOk, wipersOk: payload.wipersOk,
        mirrorsOk: payload.mirrorsOk, seatbeltsOk: payload.seatbeltsOk, acOk: payload.acOk,
        cleanInside: payload.cleanInside, extinguisherOk: payload.extinguisherOk,
        firstAidOk: payload.firstAidOk, emergencyHammerOk: payload.emergencyHammerOk,
        odometerKm: payload.odometerKm ?? null,
        fuelLevelPercent: payload.fuelLevelPercent ?? null,
        issueNote: payload.issueNote ?? null,
        hasIssue,
      },
      update: {
        fuelOk: payload.fuelOk, tiresOk: payload.tiresOk, brakesOk: payload.brakesOk,
        lightsOk: payload.lightsOk, hornOk: payload.hornOk, wipersOk: payload.wipersOk,
        mirrorsOk: payload.mirrorsOk, seatbeltsOk: payload.seatbeltsOk, acOk: payload.acOk,
        cleanInside: payload.cleanInside, extinguisherOk: payload.extinguisherOk,
        firstAidOk: payload.firstAidOk, emergencyHammerOk: payload.emergencyHammerOk,
        odometerKm: payload.odometerKm ?? null,
        fuelLevelPercent: payload.fuelLevelPercent ?? null,
        issueNote: payload.issueNote ?? null,
        hasIssue,
      },
    });

    await this.audit.log({
      tenantId, userId: driverId,
      action: 'PRE_TRIP_CHECK' as any,
      entityType: 'TRIP', entityId: tripId,
      newValues: { hasIssue, odometerKm: payload.odometerKm, fuelLevelPercent: payload.fuelLevelPercent },
    });

    // Sorun varsa admin'e e-posta uyarısı
    if (hasIssue) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { supportEmail: true },
      });
      if (tenant?.supportEmail) {
        this.notifications.sendPreTripIssueAlert(tenant.supportEmail, {
          vehiclePlate: trip.vehicle.registrationPlate,
          route: `${trip.route.originStation.city} → ${trip.route.destinationStation.city}`,
          issueNote: payload.issueNote,
          failedChecks: [
            !payload.fuelOk && 'Yakıt',
            !payload.tiresOk && 'Lastik',
            !payload.brakesOk && 'Fren',
            !payload.lightsOk && 'Farlar',
            !payload.hornOk && 'Korna',
            !payload.wipersOk && 'Silecek',
            !payload.mirrorsOk && 'Ayna',
            !payload.seatbeltsOk && 'Emniyet kemeri',
            !payload.acOk && 'Klima',
            !payload.cleanInside && 'İç temizlik',
            !payload.extinguisherOk && 'Yangın söndürücü',
            !payload.firstAidOk && 'İlk yardım çantası',
            !payload.emergencyHammerOk && 'Cam kırıcı çekiç',
          ].filter(Boolean) as string[],
        }).catch((err: any) => console.error(`[PreTripCheck] Email failed: ${err?.message}`));
      }
    }

    return saved;
  }
}
