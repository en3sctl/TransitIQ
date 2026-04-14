import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CustomerRegisterDto, CustomerLoginDto, GuestTicketLookupDto, UpdateProfileDto, ChangePasswordDto } from './dto/customer-auth.dto';
import { BadRequestException } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';

const PUBLIC_TENANT_SLUG = 'public-passengers';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
  ) {}

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

  async register(dto: RegisterDto) {
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

    const hashedPassword = await bcrypt.hash(dto.password, 10);
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
    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    console.log(`[Auth] Login attempt for email: ${dto.email}`);
    
    const user = await (this.prisma as any).user.findFirst({
      where: { email: dto.email.toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      console.warn(`[Auth] User not found: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      console.warn(`[Auth] Invalid password for: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[Auth] Login successful for: ${dto.email}`);
    return this.generateToken(user);
  }

  // ─── B2C: Customer Registration ───
  async customerRegister(dto: CustomerRegisterDto) {
    const publicTenant = await this.getOrCreatePublicTenant();

    const existingUser = await (this.prisma as any).user.findFirst({
      where: { email: dto.email.toLowerCase(), tenantId: publicTenant.id },
    });

    if (existingUser) {
      throw new ConflictException('Bu email ile zaten bir hesap var');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

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

    return this.generateToken(user);
  }

  // ─── B2C: Customer Login ───
  async customerLogin(dto: CustomerLoginDto) {
    const publicTenant = await this.getOrCreatePublicTenant();

    const user = await (this.prisma as any).user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        tenantId: publicTenant.id,
        role: 'PASSENGER',
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    return this.generateToken(user);
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

    const newHash = await bcrypt.hash(dto.newPassword, 10);
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

  private generateToken(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      tenantId: user.tenantId,
      role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      }
    };
  }
}
