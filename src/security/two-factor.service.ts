import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';

// otplib v13+ exposes a functional API (no authenticator singleton).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const otplib = require('otplib');
const TOTP_OPTS = { strategy: 'totp' as const, digits: 6, period: 30, algorithm: 'sha1' as const };

function makeSecret(): string {
  return otplib.generateSecret({ length: 20 });
}
function makeUri(label: string, issuer: string, secret: string): string {
  return otplib.generateURI({ ...TOTP_OPTS, issuer, label, secret });
}
function checkCode(token: string, secret: string): boolean {
  try {
    const res = otplib.verifySync({ ...TOTP_OPTS, token, secret, window: 1 });
    return !!(res && (res.isValid ?? res.valid ?? res));
  } catch {
    return false;
  }
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Start 2FA setup. Generates a new secret (unverified) and returns
   * an otpauth:// URL for the user's authenticator app.
   */
  async setupBegin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new NotFoundException();

    // If already enabled, reject — must disable first
    const existing = await this.prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (existing?.enabled) {
      throw new BadRequestException('2FA zaten etkin. Önce devre dışı bırak.');
    }

    const secret = makeSecret();
    const issuer = 'TransitIQ';
    const otpauth = makeUri(user.email, issuer, secret);

    await this.prisma.twoFactorSecret.upsert({
      where: { userId },
      create: { userId, secret, enabled: false, backupCodes: [] },
      update: { secret, enabled: false, backupCodes: [] },
    });

    return {
      secret,
      otpauth,
      label: `${issuer}:${user.email}`,
    };
  }

  /** Verify the first code from the user's authenticator app and enable 2FA. */
  async setupVerify(userId: string, code: string) {
    const record = await this.prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (!record) throw new BadRequestException('Önce kurulum başlat');
    if (record.enabled) throw new BadRequestException('Zaten etkin');

    const ok = checkCode(code, record.secret);
    if (!ok) throw new UnauthorizedException('Doğrulama kodu hatalı');

    // Generate 10 backup codes (one-time use, shown once)
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const c = crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 10);
      plainCodes.push(c);
      hashedCodes.push(await bcrypt.hash(c, 8));
    }

    await this.prisma.twoFactorSecret.update({
      where: { userId },
      data: {
        enabled: true,
        enabledAt: new Date(),
        backupCodes: hashedCodes,
      },
    });

    this.logger.log(`[2FA] Enabled for user ${userId}`);
    return { enabled: true, backupCodes: plainCodes };
  }

  async disable(userId: string, code: string) {
    const record = await this.prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (!record?.enabled) throw new BadRequestException('2FA zaten kapalı');
    const ok = await this.verifyCode(userId, code);
    if (!ok) throw new UnauthorizedException('Kod hatalı');

    await this.prisma.twoFactorSecret.delete({ where: { userId } });
    this.logger.log(`[2FA] Disabled for user ${userId}`);
    return { disabled: true };
  }

  /** Returns true if user has 2FA enabled. */
  async isEnabled(userId: string): Promise<boolean> {
    const r = await this.prisma.twoFactorSecret.findUnique({ where: { userId }, select: { enabled: true } });
    return !!r?.enabled;
  }

  /**
   * Verify a 6-digit TOTP code OR a backup code.
   * Consumes the backup code if used.
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const record = await this.prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (!record?.enabled) return false;
    const cleanCode = code.replace(/\s/g, '').toUpperCase();

    // Try TOTP first (6 digits)
    if (/^\d{6}$/.test(cleanCode)) {
      const ok = checkCode(cleanCode, record.secret);
      if (ok) {
        await this.prisma.twoFactorSecret.update({
          where: { userId },
          data: { lastUsedAt: new Date() },
        });
        return true;
      }
    }

    // Try backup codes
    for (let i = 0; i < record.backupCodes.length; i++) {
      const match = await bcrypt.compare(cleanCode, record.backupCodes[i]);
      if (match) {
        // Consume this backup code
        const remaining = record.backupCodes.filter((_, idx) => idx !== i);
        await this.prisma.twoFactorSecret.update({
          where: { userId },
          data: { backupCodes: remaining, lastUsedAt: new Date() },
        });
        this.logger.warn(`[2FA] Backup code consumed by user ${userId} (${remaining.length} remaining)`);
        return true;
      }
    }

    return false;
  }

  async status(userId: string) {
    const r = await this.prisma.twoFactorSecret.findUnique({
      where: { userId },
      select: { enabled: true, enabledAt: true, lastUsedAt: true, backupCodes: true },
    });
    return {
      enabled: !!r?.enabled,
      enabledAt: r?.enabledAt || null,
      lastUsedAt: r?.lastUsedAt || null,
      backupCodesRemaining: r?.backupCodes?.length || 0,
    };
  }
}
