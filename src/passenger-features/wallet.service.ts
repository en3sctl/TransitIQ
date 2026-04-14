import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Digital wallet for passengers.
 * - Credit from referrals, refunds, promotions
 * - Debit when applied to bookings
 * - All changes go through transactions to keep balance consistent
 */
@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return { balance: Number(user.walletBalance) };
  }

  async getTransactions(userId: string, limit = 50) {
    const txs = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return txs.map((t) => ({ ...t, amount: Number(t.amount) }));
  }

  /**
   * Credit the wallet. Called by:
   * - Referral service (on referee's first booking)
   * - Booking cancellation when Iyzico refund fails → manual credit
   * - Promotions / customer support
   */
  async credit(
    userId: string,
    amount: number,
    type: 'REFERRAL' | 'REFUND' | 'PROMOTION' | 'ADJUSTMENT',
    reason: string,
    bookingId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (amount <= 0) throw new BadRequestException('Pozitif miktar gerekli');
    const client = tx || this.prisma;

    const user = await client.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } },
    });

    await client.walletTransaction.create({
      data: {
        userId,
        amount,
        type,
        reason,
        bookingId,
      },
    });

    return { balance: Number(user.walletBalance) };
  }

  /**
   * Debit the wallet for a booking payment.
   * Returns the actual amount debited (capped to balance).
   */
  async debit(
    userId: string,
    amount: number,
    reason: string,
    bookingId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (amount <= 0) return { debited: 0, balance: 0 };
    const client = tx || this.prisma;

    const user = await client.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const current = Number(user.walletBalance);
    const debit = Math.min(current, amount);
    if (debit === 0) return { debited: 0, balance: current };

    const updated = await client.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: debit } },
    });

    await client.walletTransaction.create({
      data: {
        userId,
        amount: -debit,
        type: 'PAYMENT',
        reason,
        bookingId,
      },
    });

    return { debited: debit, balance: Number(updated.walletBalance) };
  }
}
