import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Inject, forwardRef, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CustomerRegisterDto, CustomerLoginDto, GuestTicketLookupDto, UpdateProfileDto, ChangePasswordDto } from './dto/customer-auth.dto';
import { BadRequestException } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { WaitingListService } from '../waiting-list/waiting-list.service';
import { ReferralService } from '../passenger-features/referral.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SessionsService } from '../security/sessions.service';

const PUBLIC_TENANT_SLUG = 'public-passengers';

/**
 * In-memory login attempt tracker.
 * Key: `ip|email`. Tracks last N failed attempts; blocks when threshold exceeded.
 * Production-ready replacement: Redis with expiring keys.
 */
class LoginAttemptTracker {
  private attempts = new Map<string, number[]>();
  readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  readonly MAX_ATTEMPTS = 5;

  record(key: string) {
    const now = Date.now();
    const arr = (this.attempts.get(key) || []).filter((t) => now - t < this.WINDOW_MS);
    arr.push(now);
    this.attempts.set(key, arr);
  }

  clear(key: string) {
    this.attempts.delete(key);
  }

  isBlocked(key: string): { blocked: boolean; retryAfterSec?: number } {
    const arr = this.attempts.get(key) || [];
    const now = Date.now();
    const recent = arr.filter((t) => now - t < this.WINDOW_MS);
    if (recent.length < this.MAX_ATTEMPTS) return { blocked: false };
    const oldest = recent[0];
    const retryAfterSec = Math.ceil((this.WINDOW_MS - (now - oldest)) / 1000);
    return { blocked: true, retryAfterSec };
  }
}

const loginTracker = new LoginAttemptTracker();

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
    @Inject(forwardRef(() => ReferralService))
    private referralService: ReferralService,
    private notifications: NotificationsService,
    @Inject(forwardRef(() => WaitingListService))
    private waitingList: WaitingListService,
    private sessions: SessionsService,
  ) {}

  private getFrontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /** Enforce brute-force limit before trying any password comparison. */
  private assertNotBlocked(ip: string, email: string) {
    const key = `${ip || 'unknown'}|${email.toLowerCase()}`;
    const status = loginTracker.isBlocked(key);
    if (status.blocked) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Çok fazla başarısız deneme. ${status.retryAfterSec} saniye sonra tekrar dene.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailedLogin(ip: string, email: string) {
    loginTracker.record(`${ip || 'unknown'}|${email.toLowerCase()}`);
  }

  private clearLoginAttempts(ip: string, email: string) {
    loginTracker.clear(`${ip || 'unknown'}|${email.toLowerCase()}`);
  }

  /** Ensures a shared tenant exists for all passenger accounts. */
  private async getOrCreatePublicTenant() {
    let tenant = await (this.prisma as any).tenant.findUnique({
      where: { slug: PUBLIC_TENANT_SLUG },
    });
    if (!tenant) {
      tenant = await (this.prisma as any).tenant.create({
        data: {
          name: 'TransitIQ Passengers',
          slug: PUBLIC_TENANT_SLUG,
        },
      });
    }
    return tenant;
  }

  async register(dto: RegisterDto, ip = '', ua = '') {
    // Check if company domain or email already exists
    const existingTenant = await (this.prisma as any).tenant.findUnique({
      where: { domain: dto.companyDomain },
    });
    if (existingTenant) {
      throw new ConflictException('Company domain already registered');
    }

    const existingUser = await (this.prisma as any).user.findFirst({
        where: { email: dto.email }
    });
    if (existingUser) {
        throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const slug = dto.companyDomain.toLowerCase(); // Use domain as slug for consistency

    // Atomic creation of Tenant and User
    const tenant = await (this.prisma as any).tenant.create({
      data: {
        name: dto.companyName,
        domain: dto.companyDomain,
        slug,
        users: {
          create: {
            name: dto.fullName,
            email: dto.email,
            passwordHash: hashedPassword,
            role: 'COMPANY_ADMIN',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = tenant.users[0];
    return this.generateTokenPair(user, { ip, ua });
  }

  async login(dto: LoginDto, ip = '', ua = '') {
    this.assertNotBlocked(ip, dto.email);

    const user = await (this.prisma as any).user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
      include: { tenant: true },
    });

    if (!user) {
      this.recordFailedLogin(ip, dto.email);
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.recordFailedLogin(ip, dto.email);
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    this.clearLoginAttempts(ip, dto.email);
    return this.generateTokenPair(user, { ip, ua });
  }

  // ─── B2C: Customer Registration ───
  async customerRegister(dto: CustomerRegisterDto, ip = '', ua = '') {
    const publicTenant = await this.getOrCreatePublicTenant();

    const existingUser = await (this.prisma as any).user.findFirst({
      where: { email: dto.email.toLowerCase(), tenantId: publicTenant.id },
    });

    if (existingUser) {
      throw new ConflictException('Bu email ile zaten bir hesap var');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await (this.prisma as any).user.create({
      data: {
        tenantId: publicTenant.id,
        name: `${dto.firstName} ${dto.lastName}`,
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        phoneNumber: dto.phone || null,
        role: 'PASSENGER',
      },
    });

    // Attach referrer if valid code provided (silent fail — registration must not break)
    if (dto.referralCode?.trim()) {
      try {
        await this.referralService.attachReferrer(user.id, dto.referralCode);
      } catch {
        // Invalid code is non-fatal
      }
    }

    // Pre-generate referral code so user sees it immediately
    try {
      await this.referralService.getOrCreateCode(user.id);
    } catch {
      //
    }

    return this.generateTokenPair(user, { ip, ua });
  }

  // ─── B2C: Customer Login ───
  async customerLogin(dto: CustomerLoginDto, ip = '', ua = '') {
    this.assertNotBlocked(ip, dto.email);

    const publicTenant = await this.getOrCreatePublicTenant();

    const user = await (this.prisma as any).user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        tenantId: publicTenant.id,
        role: 'PASSENGER',
        deletedAt: null,
      },
    });

    if (!user) {
      this.recordFailedLogin(ip, dto.email);
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.recordFailedLogin(ip, dto.email);
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    this.clearLoginAttempts(ip, dto.email);
    return this.generateTokenPair(user, { ip, ua });
  }

  // ─── Password Reset (request) ───
  /**
   * Always returns ok: true to prevent email enumeration.
   * If email matches a user, sends reset link with a 30-minute token.
   */
  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { ok: true };

    const user = await this.prisma.user.findFirst({
      where: { email: normalized, deletedAt: null },
    });

    if (user) {
      const token = this.generateRandomToken();
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const resetUrl = `${this.getFrontendUrl()}/sifre-sifirla?token=${token}`;

      // Dev logging: print the reset URL so devs can test without real email delivery
      // (Resend's onboarding@resend.dev only sends to account-owner's registered email).
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n══════════════════════════════════════════════════════════════');
        console.log(`[DEV] Password reset link for ${user.email}:`);
        console.log(resetUrl);
        console.log('══════════════════════════════════════════════════════════════\n');
      }

      // Fire and forget — must not block response (avoid timing oracle)
      this.notifications.sendPasswordResetEmail(user.email, user.name, resetUrl).catch(() => {});
    }

    return { ok: true };
  }

  // ─── Password Reset (confirm) ───
  async confirmPasswordReset(token: string, newPassword: string) {
    if (!token || !newPassword || newPassword.length < 6) {
      throw new BadRequestException('Geçersiz istek');
    }

    const tokenHash = this.hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Link geçersiz veya süresi dolmuş');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all other outstanding reset tokens for this user
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  // ─── Email Verification (send) ───
  async sendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı yok');
    if ((user as any).emailVerifiedAt) return { ok: true, alreadyVerified: true };

    const token = this.generateRandomToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tokenHash, expiresAt },
      update: { tokenHash, expiresAt, verifiedAt: null },
    });

    const verifyUrl = `${this.getFrontendUrl()}/email-dogrula?token=${token}`;
    this.notifications.sendEmailVerification(user.email, user.name, verifyUrl).catch(() => {});
    return { ok: true };
  }

  // ─── Email Verification (confirm) ───
  async confirmEmailVerification(token: string) {
    if (!token) throw new BadRequestException('Token eksik');

    const tokenHash = this.hashToken(token);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.verifiedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Link geçersiz veya süresi dolmuş');
    }

    await this.prisma.$transaction([
      (this.prisma as any).user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  // ─── Guest Ticket Lookup (no auth, PNR + email verification) ───
  async guestTicketLookup(dto: GuestTicketLookupDto) {
    const booking = await (this.prisma as any).booking.findUnique({
      where: { pnrCode: dto.pnrCode.toUpperCase() },
      include: {
        trip: {
          include: {
            route: {
              include: { originStation: true, destinationStation: true },
            },
            vehicle: true,
          },
        },
        seat: true,
      },
    });

    if (!booking || booking.contactEmail.toLowerCase() !== dto.email.toLowerCase()) {
      throw new NotFoundException('Bilet bulunamadı. PNR veya email hatalı olabilir.');
    }

    return {
      pnrCode: booking.pnrCode,
      status: booking.status,
      pricePaid: booking.pricePaid,
      bookingTime: booking.bookingTime,
      passenger: {
        name: booking.passengerName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
      },
      seat: { number: booking.seat.seatNumber, type: booking.seat.type },
      trip: {
        departureTime: booking.trip.departureTime,
        estimatedArrival: booking.trip.estimatedArrival,
        origin: {
          name: booking.trip.route.originStation.name,
          city: booking.trip.route.originStation.city,
        },
        destination: {
          name: booking.trip.route.destinationStation.name,
          city: booking.trip.route.destinationStation.city,
        },
        busInfo: `${booking.trip.vehicle.layoutType} ${booking.trip.vehicle.registrationPlate}`,
      },
    };
  }

  // ─── Get user profile + stats ───
  async getCustomerProfile(userId: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const [totalBookings, activeBookings, pastBookings] = await Promise.all([
      (this.prisma as any).booking.count({ where: { userId } }),
      (this.prisma as any).booking.count({
        where: {
          userId,
          status: 'CONFIRMED',
          trip: { departureTime: { gte: new Date() } },
        },
      }),
      (this.prisma as any).booking.count({
        where: {
          userId,
          status: 'CONFIRMED',
          trip: { departureTime: { lt: new Date() } },
        },
      }),
    ]);

    const parts = (user.name || '').split(' ');
    const firstName = parts.slice(0, -1).join(' ') || parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

    return {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      phone: user.phoneNumber || '',
      memberSince: user.createdAt,
      stats: {
        totalBookings,
        activeBookings,
        pastBookings,
      },
    };
  }

  // ─── Update profile (name, phone) ───
  async updateCustomerProfile(userId: string, dto: UpdateProfileDto) {
    const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const data: { name?: string; phoneNumber?: string | null } = {};

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const currentParts = (user.name || '').split(' ');
      const currentFirst = currentParts.slice(0, -1).join(' ') || currentParts[0] || '';
      const currentLast = currentParts.length > 1 ? currentParts[currentParts.length - 1] : '';
      const firstName = (dto.firstName ?? currentFirst).trim();
      const lastName = (dto.lastName ?? currentLast).trim();
      data.name = `${firstName} ${lastName}`.trim();
    }

    if (dto.phone !== undefined) {
      data.phoneNumber = dto.phone || null;
    }

    const updated = await (this.prisma as any).user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, phoneNumber: true, role: true, tenantId: true },
    });

    return {
      message: 'Profil güncellendi',
      user: updated,
    };
  }

  // ─── Change password ───
  async changeCustomerPassword(userId: string, dto: ChangePasswordDto) {
    const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Mevcut şifre hatalı');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Yeni şifre eskisinden farklı olmalı');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await (this.prisma as any).user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Şifre güncellendi' };
  }

  // ─── Cancel own booking (customer) with Iyzico refund ───
  async cancelOwnBooking(userId: string, bookingId: string) {
    const booking = await (this.prisma as any).booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: { select: { departureTime: true } },
      },
    });

    if (!booking) throw new NotFoundException('Bilet bulunamadı');
    if (booking.userId !== userId) {
      throw new UnauthorizedException('Bu biletin sahibi siz değilsiniz');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu bilet zaten iptal edilmiş veya kullanılmış');
    }

    // Cancellation window: must be at least 6 hours before departure
    const now = Date.now();
    const departure = new Date(booking.trip.departureTime).getTime();
    const hoursUntilDeparture = (departure - now) / (1000 * 60 * 60);
    if (hoursUntilDeparture < 6) {
      throw new BadRequestException('Kalkış saatine 6 saatten az kaldığında iptal yapılamaz');
    }

    // 1) Cancel booking + free seat in DB transaction
    const cancelled = await (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', refundStatus: 'PENDING' },
      });
      await tx.seat.update({
        where: { id: booking.seatId },
        data: { status: 'AVAILABLE', lockedUntil: null, lockedBy: null },
      });
      return updated;
    });

    // 2) Try Iyzico refund (outside transaction to avoid holding DB lock on external call)
    let refundResult: { success: boolean; refundId?: string; errorMessage?: string } = { success: false };
    let refundMessage = 'İade 3-7 iş günü içinde kartınıza yansır.';

    if (booking.paymentTransactionId) {
      refundResult = await this.paymentService.refundPayment(
        booking.paymentTransactionId,
        booking.pricePaid.toString(),
      );

      await (this.prisma as any).booking.update({
        where: { id: bookingId },
        data: {
          refundStatus: refundResult.success ? 'REFUNDED' : 'FAILED',
          refundedAt: refundResult.success ? new Date() : null,
        },
      });

      if (!refundResult.success) {
        refundMessage = 'Bilet iptal edildi ancak otomatik iade başarısız oldu. Destek ekibimiz sizinle iletişime geçecek.';
      } else {
        refundMessage = `₺${booking.pricePaid} iade edildi. Kart sağlayıcınıza göre 3-7 iş günü içinde hesabınıza yansır.`;
      }
    } else {
      // No paymentTransactionId stored — legacy booking, no automatic refund possible
      refundMessage = 'Bilet iptal edildi. İade için destek ekibiyle iletişime geçin.';
      await (this.prisma as any).booking.update({
        where: { id: bookingId },
        data: { refundStatus: 'MANUAL' },
      });
    }

    // Notify top waiting-list members for this trip (fire-and-forget).
    // Passenger-initiated cancels go through this path, so it's the
    // primary trigger for seat-available emails.
    this.waitingList.handleSeatsFreed(booking.tripId).catch((err) => {
      console.error('[cancelOwnBooking] handleSeatsFreed failed:', err);
    });

    return {
      message: `Bilet iptal edildi. ${refundMessage}`,
      pnrCode: cancelled.pnrCode,
      refundSuccess: refundResult.success,
    };
  }

  // ─── Get logged-in user's bookings ───
  async getUserBookings(userId: string) {
    const bookings = await (this.prisma as any).booking.findMany({
      where: { userId },
      orderBy: { bookingTime: 'desc' },
      include: {
        trip: {
          include: {
            route: {
              include: { originStation: true, destinationStation: true },
            },
            vehicle: true,
          },
        },
        seat: true,
      },
    });

    return bookings.map((b: any) => ({
      id: b.id,
      pnrCode: b.pnrCode,
      status: b.status,
      pricePaid: b.pricePaid,
      bookingTime: b.bookingTime,
      passengerName: b.passengerName,
      seat: { number: b.seat.seatNumber, type: b.seat.type },
      trip: {
        departureTime: b.trip.departureTime,
        estimatedArrival: b.trip.estimatedArrival,
        origin: {
          name: b.trip.route.originStation.name,
          city: b.trip.route.originStation.city,
        },
        destination: {
          name: b.trip.route.destinationStation.name,
          city: b.trip.route.destinationStation.city,
        },
        busInfo: `${b.trip.vehicle.layoutType} ${b.trip.vehicle.registrationPlate}`,
      },
    }));
  }

  // ─── B2C: Google OAuth login / signup ───
  async loginWithGoogle(profile: { googleId: string; email: string; name: string; avatarUrl: string | null }, referralCode?: string, ip = '', ua = '') {
    const publicTenant = await this.getOrCreatePublicTenant();
    const email = profile.email.toLowerCase();

    // 1) Existing user linked to this Google account
    let user = await (this.prisma as any).user.findFirst({
      where: { googleId: profile.googleId, deletedAt: null },
    });

    // 2) Existing user by email — link Google to the account
    if (!user) {
      user = await (this.prisma as any).user.findFirst({
        where: { email, tenantId: publicTenant.id, deletedAt: null },
      });

      if (user) {
        user = await (this.prisma as any).user.update({
          where: { id: user.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: user.avatarUrl || profile.avatarUrl,
            emailVerifiedAt: user.emailVerifiedAt || new Date(),
          },
        });
      }
    }

    // 3) Brand-new user — create PASSENGER
    if (!user) {
      // Random high-entropy password placeholder (user can always use password reset later)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await (this.prisma as any).user.create({
        data: {
          tenantId: publicTenant.id,
          name: profile.name,
          email,
          passwordHash,
          role: 'PASSENGER',
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          emailVerifiedAt: new Date(),
        },
      });

      if (referralCode?.trim()) {
        try {
          await this.referralService.attachReferrer(user.id, referralCode);
        } catch {
          // Invalid code is non-fatal
        }
      }

      try {
        await this.referralService.getOrCreateCode(user.id);
      } catch {
        //
      }
    }

    return this.generateTokenPair(user, { ip, ua });
  }

  /**
   * Yeni token akışı (2026-04-18):
   *  - access_token: kısa ömürlü JWT (15dk varsayılan, JWT_ACCESS_EXPIRES_IN ile değişir)
   *  - refresh_token: 32-byte hex random, UserSession'a SHA-256 hash'lenmiş kayıtlı (30g)
   *
   * Controller refresh_token'ı response body'den alıp httpOnly cookie'ye yazar.
   * Eski client'lar `access_token` field'ını kullanabilmeye devam eder (geriye uyumlu).
   */
  private async generateTokenPair(
    user: any,
    meta: { ip?: string; ua?: string } = {},
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    const refresh_token = crypto.randomBytes(32).toString('hex');
    const refreshTtlDays = parseInt(this.config.get('JWT_REFRESH_EXPIRES_DAYS') || '30', 10);
    await this.sessions.register(user.id, refresh_token, {
      userAgent: meta.ua,
      ipAddress: meta.ip,
      ttlHours: refreshTtlDays * 24,
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Refresh akışı: cookie'den gelen ham refresh token'ı doğrular,
   * eski session'ı revoke eder (rotation), yeni access+refresh döner.
   * Token rotation = çalınmış token tespiti için en iyi uygulama.
   */
  async refreshTokens(rawRefreshToken: string, meta: { ip?: string; ua?: string } = {}) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('Geçersiz oturum');
    }
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true, tenantId: true, deletedAt: true, suspendedAt: true },
        },
      },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Oturum süresi doldu — yeniden giriş yap');
    }
    if (!session.user || session.user.deletedAt) {
      throw new UnauthorizedException('Hesap kapatıldı');
    }
    if (session.user.suspendedAt) {
      throw new UnauthorizedException('Hesap askıya alındı');
    }

    // Rotate: eski session'ı revoke et, yenisini oluştur
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokenPair(session.user, meta);
  }

  /** Logout: refresh token'a karşılık gelen UserSession'ı revoke eder. */
  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await this.prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
