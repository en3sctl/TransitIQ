import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WalletService } from './wallet.service';

/**
 * Referral program:
 * - Every user gets a unique referral code on first access
 * - New user sets `referredById` at registration (optional)
 * - When referee completes first booking, both parties get 50 TRY wallet credit
 */
@Injectable()
export class ReferralService {
  private readonly REFERRER_BONUS = 50;
  private readonly REFEREE_BONUS = 50;

  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async getOrCreateCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, name: true },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    if (user.referralCode) return user.referralCode;

    const code = await this.generateUniqueCode(user.name);
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  }

  async attachReferrer(userId: string, referralCode: string) {
    const code = referralCode.trim().toUpperCase();
    if (!code) return;

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!referrer) throw new BadRequestException('Referans kodu geçersiz');
    if (referrer.id === userId) throw new BadRequestException('Kendi kodunu kullanamazsın');

    await this.prisma.user.update({
      where: { id: userId },
      data: { referredById: referrer.id },
    });
  }

  /**
   * Called by booking service after first successful booking.
   * Idempotent: checks if referee already has previous bookings.
   */
  async grantFirstBookingBonus(userId: string, bookingId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true },
    });
    if (!user?.referredById) return;

    const previousBookings = await this.prisma.booking.count({
      where: { userId, status: 'CONFIRMED', id: { not: bookingId } },
    });
    if (previousBookings > 0) return;

    await this.wallet.credit(
      user.referredById,
      this.REFERRER_BONUS,
      'REFERRAL',
      `Referans: ${userId.slice(0, 8)} ilk biletini aldı`,
      bookingId,
    );
    await this.wallet.credit(
      userId,
      this.REFEREE_BONUS,
      'REFERRAL',
      `Davet bonusun`,
      bookingId,
    );
  }

  async getStats(userId: string) {
    const [referrals, transactions] = await Promise.all([
      this.prisma.user.findMany({
        where: { referredById: userId },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.findMany({
        where: { userId, type: 'REFERRAL' },
      }),
    ]);
    const totalEarned = transactions.reduce((s, t) => s + Number(t.amount), 0);
    return {
      referralsCount: referrals.length,
      totalEarned,
      recentReferrals: referrals.slice(0, 10),
    };
  }

  private async generateUniqueCode(name: string): Promise<string> {
    const base = (name || 'USER').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'TRIP';
    for (let i = 0; i < 10; i++) {
      const suffix = Math.random().toString(36).slice(-4).toUpperCase();
      const code = `${base}${suffix}`;
      const exists = await this.prisma.user.findUnique({ where: { referralCode: code } });
      if (!exists) return code;
    }
    // Fallback
    return `TRIP${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }
}
