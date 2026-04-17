import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(userId: string, token: string, opts: { userAgent?: string; ipAddress?: string; ttlHours?: number } = {}) {
    const ttl = opts.ttlHours || 24;
    const expiresAt = new Date(Date.now() + ttl * 3600 * 1000);
    return this.prisma.userSession.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        userAgent: opts.userAgent?.slice(0, 500) || null,
        ipAddress: opts.ipAddress?.slice(0, 45) || null,
        expiresAt,
      },
    });
  }

  async touch(tokenHash: string) {
    try {
      await this.prisma.userSession.update({
        where: { tokenHash },
        data: { lastSeenAt: new Date() },
      });
    } catch { /* not tracked or expired — ignore */ }
  }

  async list(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true, userAgent: true, ipAddress: true,
        lastSeenAt: true, createdAt: true, expiresAt: true,
      },
    });
  }

  async revokeOne(userId: string, sessionId: string) {
    return this.prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string, exceptTokenHash?: string) {
    const where: any = { userId, revokedAt: null };
    if (exceptTokenHash) where.NOT = { tokenHash: exceptTokenHash };
    const result = await this.prisma.userSession.updateMany({
      where,
      data: { revokedAt: new Date() },
    });
    this.logger.log(`[Sessions] Revoked ${result.count} sessions for user ${userId}`);
    return result;
  }

  async isRevoked(token: string): Promise<boolean> {
    const hash = this.hashToken(token);
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash: hash },
      select: { revokedAt: true, expiresAt: true },
    });
    if (!session) return false; // untracked — not revoked
    if (session.revokedAt) return true;
    if (session.expiresAt < new Date()) return true;
    return false;
  }

  /**
   * Super-admin: view sessions across the platform (paginated).
   */
  async superAdminList(opts: { userId?: string; take?: number; skip?: number } = {}) {
    const { userId, take = 50, skip = 0 } = opts;
    const where: any = { revokedAt: null, expiresAt: { gt: new Date() } };
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      this.prisma.userSession.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        take, skip,
        include: {
          user: { select: { id: true, name: true, email: true, role: true, tenant: { select: { name: true, publicName: true } } } },
        },
      }),
      this.prisma.userSession.count({ where }),
    ]);
    return { items, total };
  }

  /** Background cleanup — remove expired sessions older than 7 days. */
  async cleanup() {
    const cutoff = new Date(Date.now() - 7 * 86400000);
    const result = await this.prisma.userSession.deleteMany({
      where: { OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }] },
    });
    this.logger.log(`[Sessions] Cleanup removed ${result.count} old sessions`);
    return result;
  }
}
