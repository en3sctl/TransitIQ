import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DriverOpsService } from '../driver-ops/driver-ops.service';
import { SeatStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly notificationsService: NotificationsService,
    private readonly driverOps: DriverOpsService,
  ) {}

  /** Gold Driver rozet değerlendirmesi — günlük 03:00. */
  @Cron('0 3 * * *', { timeZone: 'Europe/Istanbul' })
  async goldDriverEvaluation() {
    try {
      const res = await this.driverOps.evaluateGoldDrivers();
      if (res.updated > 0) this.logger.log(`[GOLD DRIVER] ${res.updated} yeni Gold Driver tanındı`);
    } catch (err: any) {
      this.logger.error(`[GOLD DRIVER] ${err.message}`);
    }
  }

  /** Eski road alert + wallet token cleanup — her saat. */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupDriverOps() {
    const now = new Date();
    const [alerts, tokens] = await Promise.all([
      (this.prisma as any).roadAlert.deleteMany({
        where: { expiresAt: { lt: new Date(now.getTime() - 24 * 3600 * 1000) } },
      }),
      (this.prisma as any).driverWalletToken.deleteMany({
        where: { expiresAt: { lt: new Date(now.getTime() - 7 * 86400 * 1000) } },
      }),
    ]);
    if (alerts.count > 0 || tokens.count > 0) {
      this.logger.log(`[CLEANUP] ${alerts.count} alert, ${tokens.count} token silindi`);
    }
  }

  /** Vardiya saat limiti — her 30 dakikada aktif seferleri tara. */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async driverShiftLimitCheck() {
    try {
      const res = await this.driverOps.checkShiftLimits();
      if (res.warningCount > 0) this.logger.warn(`[VARDİYA] ${res.warningCount} şoför 8+ saattir direksiyonda`);
    } catch (err: any) {
      this.logger.error(`[VARDİYA] ${err.message}`);
    }
  }

  /**
   * Releases expired seat locks every minute.
   * Seats locked but never paid for become available again after 10 minutes.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredSeatLocks() {
    const now = new Date();
    const result = await this.prisma.seat.updateMany({
      where: {
        status: SeatStatus.LOCKED,
        lockedUntil: { lt: now },
      },
      data: {
        status: SeatStatus.AVAILABLE,
        lockedUntil: null,
        lockedBy: null,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Released ${result.count} expired seat lock(s)`);
    }
  }

  /**
   * Cleans up old pending payment records every hour.
   * Pending payments older than 24h are abandoned (user never completed payment).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldPendingPayments() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.pendingPayment.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} abandoned pending payment(s)`);
    }
  }

  /**
   * Geçmiş seferleri otomatik COMPLETED'e çeker — her 15 dakikada bir.
   *
   * Kural:
   *   - estimatedArrival tanımlı ve geçmişse → COMPLETED
   *   - estimatedArrival yok ama departureTime + 12 saat geçmişse → COMPLETED
   *     (12 saat: en uzun TR otobüs rotasından biraz daha fazla, güvenli tampon)
   *
   * Eskiden 1 saat bekliyordu; şu an grace period sıfır.
   * Admin/driver panellerinde eski sefer hala "aktif" görünmesin diye.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async markCompletedTrips() {
    const now = new Date();
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const result = await this.prisma.trip.updateMany({
      where: {
        status: { in: ['PLANNED', 'ACTIVE'] },
        OR: [
          { estimatedArrival: { lt: now } },
          {
            estimatedArrival: null,
            departureTime: { lt: twelveHoursAgo },
          },
        ],
      },
      data: { status: 'COMPLETED' },
    });

    if (result.count > 0) {
      this.logger.log(`[AUTO-COMPLETE] ${result.count} sefer otomatik COMPLETED olarak işaretlendi`);
      // Bu seferlerdeki no-show yolculara bildirim at (fire-and-forget)
      this.notifyNoShowPassengers().catch((err) => {
        this.logger.warn(`[AUTO-COMPLETE] no-show notif başarısız: ${err.message}`);
      });
    }
  }

  /**
   * Son 24 saat içinde COMPLETED olmuş ama boardingStatus=PENDING kalan
   * yolculara "seni seferde göremedik" e-postası gönder.
   *
   * Idempotent: reminderSentAt alanı doldurulup tekrar gönderilmez.
   */
  async notifyNoShowPassengers() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const completedTrips = await this.prisma.trip.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: since },
      },
      select: {
        id: true,
        departureTime: true,
        route: {
          select: {
            originStation: { select: { city: true } },
            destinationStation: { select: { city: true } },
          },
        },
        bookings: {
          where: {
            boardingStatus: 'PENDING',
            status: 'CONFIRMED',
            reminderSentAt: null,
          },
          select: { id: true, contactEmail: true, passengerName: true, pnrCode: true },
        },
      },
    });

    let sent = 0;
    for (const trip of completedTrips) {
      const origin = trip.route.originStation.city;
      const destination = trip.route.destinationStation.city;
      for (const b of trip.bookings) {
        try {
          await this.notificationsService.sendNoShowEmail(b.contactEmail, b.passengerName, {
            pnr: b.pnrCode,
            route: `${origin} → ${destination}`,
            departureTime: trip.departureTime,
          });
          await this.prisma.booking.update({
            where: { id: b.id },
            data: { reminderSentAt: new Date() },
          });
          sent++;
        } catch (err: any) {
          this.logger.warn(`[No-Show] ${b.pnrCode}: ${err.message}`);
        }
      }
    }
    if (sent > 0) this.logger.log(`[No-Show] ${sent} yolcuya bildirim gönderildi`);
  }

  /**
   * Checks vehicle inspection (muayene) and insurance (sigorta) expiry dates.
   * Logs warnings for vehicles expiring within 30 days or already expired.
   * Runs daily at 8 AM Istanbul time.
   */
  @Cron('0 8 * * *', { timeZone: 'Europe/Istanbul' })
  async checkVehicleExpiryDates() {
    const now = new Date();
    const in30days = new Date(now.getTime() + 30 * 86400000);

    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        OR: [
          { muayeneTarihi: { lte: in30days } },
          { sigortaTarihi: { lte: in30days } },
        ],
      },
      select: {
        id: true,
        registrationPlate: true,
        muayeneTarihi: true,
        sigortaTarihi: true,
        tenant: { select: { name: true } },
      },
    });

    for (const v of vehicles) {
      if (v.muayeneTarihi && v.muayeneTarihi < now) {
        this.logger.warn(`[ARAÇ UYARI] ${v.registrationPlate} (${v.tenant.name}) — MUAYENE SÜRESİ GEÇMİŞ (${v.muayeneTarihi.toISOString().slice(0, 10)})`);
      } else if (v.muayeneTarihi && v.muayeneTarihi <= in30days) {
        this.logger.warn(`[ARAÇ UYARI] ${v.registrationPlate} (${v.tenant.name}) — Muayene 30 gün içinde (${v.muayeneTarihi.toISOString().slice(0, 10)})`);
      }
      if (v.sigortaTarihi && v.sigortaTarihi < now) {
        this.logger.warn(`[ARAÇ UYARI] ${v.registrationPlate} (${v.tenant.name}) — SİGORTA SÜRESİ GEÇMİŞ (${v.sigortaTarihi.toISOString().slice(0, 10)})`);
      } else if (v.sigortaTarihi && v.sigortaTarihi <= in30days) {
        this.logger.warn(`[ARAÇ UYARI] ${v.registrationPlate} (${v.tenant.name}) — Sigorta 30 gün içinde (${v.sigortaTarihi.toISOString().slice(0, 10)})`);
      }
    }

    if (vehicles.length > 0) {
      this.logger.log(`[ARAÇ] ${vehicles.length} araçta muayene/sigorta uyarısı var`);
    }
  }

  /**
   * Şoför belgelerinin (ehliyet, SRC, psikoteknik, sağlık raporu)
   * bitiş tarihlerini kontrol et. 30 gün içinde veya geçmiş ise firma admin'e
   * e-posta uyarısı gönder. Günde bir kere — 08:30 İstanbul.
   */
  @Cron('30 8 * * *', { timeZone: 'Europe/Istanbul' })
  async checkDriverDocumentExpiry() {
    const now = new Date();
    const in30days = new Date(now.getTime() + 30 * 86400000);

    const docs = await (this.prisma as any).driverDocument.findMany({
      where: {
        validUntil: { lte: in30days, not: null },
      },
      select: {
        id: true, type: true, validUntil: true, licenseClass: true,
        user: { select: { id: true, name: true, tenantId: true } },
      },
    });
    if (docs.length === 0) return;

    // Tenant bazlı grupla — her firmaya tek e-posta
    const byTenant = new Map<string, any[]>();
    for (const d of docs) {
      const tid = d.user.tenantId;
      if (!byTenant.has(tid)) byTenant.set(tid, []);
      byTenant.get(tid)!.push(d);
    }

    const DOC_LABEL: Record<string, string> = {
      LICENSE: 'Ehliyet', SRC1: 'SRC1', SRC2: 'SRC2', SRC3: 'SRC3', SRC4: 'SRC4',
      PSYCHOTECH: 'Psikoteknik', HEALTH_REPORT: 'Sağlık Raporu', CRIMINAL_RECORD: 'Adli Sicil',
    };

    for (const [tenantId, tenantDocs] of byTenant.entries()) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { supportEmail: true, name: true, publicName: true },
      });
      if (!tenant?.supportEmail) continue;

      for (const d of tenantDocs) {
        const daysLeft = Math.ceil((new Date(d.validUntil).getTime() - now.getTime()) / 86400000);
        const label = DOC_LABEL[d.type] || d.type;
        if (daysLeft < 0) {
          this.logger.warn(`[ŞOFÖR BELGE] ${d.user.name} — ${label} SÜRESİ GEÇMİŞ (${Math.abs(daysLeft)} gün önce)`);
        } else {
          this.logger.warn(`[ŞOFÖR BELGE] ${d.user.name} — ${label} ${daysLeft} gün içinde bitiyor`);
        }
      }

      // Tek özet e-posta
      try {
        await (this.notificationsService as any).sendDriverDocExpiryAlert?.(tenant.supportEmail, {
          tenantName: tenant.publicName || tenant.name,
          docs: tenantDocs.map((d: any) => ({
            driverName: d.user.name,
            type: DOC_LABEL[d.type] || d.type,
            licenseClass: d.licenseClass,
            validUntil: d.validUntil,
            daysLeft: Math.ceil((new Date(d.validUntil).getTime() - now.getTime()) / 86400000),
          })),
        });
      } catch (err: any) {
        this.logger.warn(`[ŞOFÖR BELGE] e-posta başarısız: ${err?.message}`);
      }
    }

    this.logger.log(`[ŞOFÖR BELGE] ${docs.length} belgede uyarı — ${byTenant.size} firmaya bildirim gönderildi`);
  }

  /**
   * Retry failed Iyzico refunds every 6 hours.
   * Bookings cancelled but refund failed get another attempt.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async retryFailedRefunds() {
    const failedBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CANCELLED',
        refundStatus: 'FAILED',
        paymentTransactionId: { not: null },
      },
      take: 20,
    });

    if (failedBookings.length === 0) return;

    let recovered = 0;
    for (const b of failedBookings) {
      if (!b.paymentTransactionId) continue;
      try {
        const result = await this.paymentService.refundPayment(
          b.paymentTransactionId,
          String(b.pricePaid),
        );
        if (result.success) {
          await this.prisma.booking.update({
            where: { id: b.id },
            data: { refundStatus: 'REFUNDED' },
          });
          recovered++;
        }
      } catch {
        // Still failing — will retry next cycle
      }
    }

    if (recovered > 0) {
      this.logger.log(`[REFUND RETRY] Kurtarıldı: ${recovered}/${failedBookings.length}`);
    }
  }

  /**
   * Send trip reminder email 24 hours before departure.
   * Runs every hour, checks bookings whose trip departs in ~24h window.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendTripReminders() {
    const now = new Date();
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSentAt: null,
        trip: { departureTime: { gte: in23h, lte: in25h } },
      },
      include: {
        trip: {
          include: {
            route: { include: { originStation: true, destinationStation: true } },
            vehicle: true,
          },
        },
      },
      take: 100,
    });

    if (bookings.length === 0) return;

    let sent = 0;
    for (const b of bookings) {
      try {
        await this.notificationsService.sendTripReminder(b as any);
        await this.prisma.booking.update({
          where: { id: b.id },
          data: { reminderSentAt: new Date() },
        });
        sent++;
      } catch (e) {
        this.logger.error(`Trip reminder failed for ${b.pnrCode}: ${e}`);
      }
    }
    if (sent > 0) this.logger.log(`[TRIP REMINDER] ${sent} hatırlatma gönderildi`);
  }

  /**
   * Weekly revenue summary — sent every Monday 09:00 Istanbul time.
   * Admin gets a snapshot of last week's performance.
   */
  @Cron('0 9 * * 1', { timeZone: 'Europe/Istanbul' })
  async sendWeeklyRevenueReport() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
    });

    for (const tenant of tenants) {
      try {
        const [agg, cancelled] = await Promise.all([
          this.prisma.booking.aggregate({
            where: {
              trip: { tenantId: tenant.id },
              status: 'CONFIRMED',
              bookingTime: { gte: weekAgo },
            },
            _sum: { pricePaid: true },
            _count: true,
          }),
          this.prisma.booking.count({
            where: {
              trip: { tenantId: tenant.id },
              status: 'CANCELLED',
              bookingTime: { gte: weekAgo },
            },
          }),
        ]);

        const admins = await this.prisma.user.findMany({
          where: { tenantId: tenant.id, role: { in: ['COMPANY_ADMIN', 'SUPER_ADMIN'] }, deletedAt: null },
          select: { email: true, name: true },
        });

        const revenue = Number(agg._sum.pricePaid || 0);
        const bookings = agg._count;

        for (const admin of admins) {
          await this.notificationsService.sendWeeklyRevenueReport(admin.email, admin.name, {
            tenantName: tenant.name,
            revenue, bookings, cancelled,
            from: weekAgo, to: now,
          });
        }
      } catch (e) {
        this.logger.error(`Weekly report failed for tenant ${tenant.id}: ${e}`);
      }
    }

    this.logger.log(`[WEEKLY REPORT] ${tenants.length} tenant için gönderildi`);
  }

  /**
   * Marks confirmed bookings on completed trips as NO_SHOW if not used.
   * (Future enhancement: only mark NO_SHOW if check-in is missing)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async markNoShowBookings() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.CONFIRMED,
        trip: {
          status: 'COMPLETED',
          departureTime: { lt: yesterday },
        },
      },
      data: { status: BookingStatus.NO_SHOW },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} booking(s) as NO_SHOW`);
    }
  }
}
