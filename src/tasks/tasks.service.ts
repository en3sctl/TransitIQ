import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SeatStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
   * Marks past trips as COMPLETED every hour.
   * Trips whose estimated arrival has passed by 1+ hours are marked completed.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async markCompletedTrips() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await this.prisma.trip.updateMany({
      where: {
        status: { in: ['PLANNED', 'ACTIVE'] },
        OR: [
          { estimatedArrival: { lt: oneHourAgo } },
          {
            estimatedArrival: null,
            departureTime: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        ],
      },
      data: { status: 'COMPLETED' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} trip(s) as COMPLETED`);
    }
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
