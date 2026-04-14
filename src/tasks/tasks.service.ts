import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { SeatStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

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
