import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CustomerRegisterDto, CustomerLoginDto, GuestTicketLookupDto } from './dto/customer-auth.dto';

const PUBLIC_TENANT_SLUG = 'public-passengers';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
