import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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
    const slug = dto.companyName.toLowerCase().replace(/ /g, '-');

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
    const user = await (this.prisma as any).user.findFirst({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
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
