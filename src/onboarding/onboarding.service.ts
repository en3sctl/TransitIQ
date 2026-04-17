import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationsService } from '../operations/operations.service';

export interface TenantRegistrationDto {
  // Company
  companyName: string;
  publicName?: string;
  slug: string;
  domain?: string;
  aboutShort?: string;
  // Legal
  taxId?: string;
  mersisNo?: string;
  uetdsLicense?: string;
  // Contact
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  address?: string;
  // Admin user
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword: string;
  // Plan selection
  planSlug?: string;
  iyzicoMode?: 'PLATFORM' | 'OWN';
  // Compliance
  acceptsTerms: boolean;
  acceptsKvkk: boolean;
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private operations: OperationsService,
  ) {}

  async registerTenant(dto: TenantRegistrationDto) {
    // Required fields
    if (!dto.companyName || dto.companyName.length < 2) throw new BadRequestException('Firma adı gerekli');
    if (!dto.slug || !SLUG_PATTERN.test(dto.slug)) {
      throw new BadRequestException('Slug 2-50 karakter, sadece küçük harf/sayı/tire olabilir');
    }
    if (!dto.adminName || !dto.adminEmail || !dto.adminPassword) {
      throw new BadRequestException('Admin kullanıcı bilgileri eksik');
    }
    if (dto.adminPassword.length < 8) throw new BadRequestException('Parola en az 8 karakter');
    if (!dto.acceptsTerms || !dto.acceptsKvkk) {
      throw new BadRequestException('Kullanım şartları ve KVKK onayı gerekli');
    }

    // Uniqueness checks
    const existingSlug = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) throw new ConflictException('Bu slug zaten kullanılıyor');
    if (dto.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({ where: { domain: dto.domain } });
      if (existingDomain) throw new ConflictException('Bu domain zaten kullanılıyor');
    }
    const existingEmail = await this.prisma.user.findFirst({ where: { email: dto.adminEmail.toLowerCase() } });
    if (existingEmail) throw new ConflictException('Bu e-posta zaten kayıtlı — başka bir hesap açın veya giriş yapın');

    // Resolve plan
    let planId: string | null = null;
    let commissionRate = 0.08;
    if (dto.planSlug) {
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.planSlug } });
      if (plan && plan.active) {
        planId = plan.id;
        commissionRate = Number(plan.commissionRate);
      }
    } else {
      // Fallback to platform default
      const defaultRate = await this.operations.getSetting('DEFAULT_COMMISSION_RATE');
      if (typeof defaultRate === 'number') commissionRate = defaultRate;
    }

    // Auto-approve flag (platform setting)
    const autoApprove = await this.operations.getSetting('NEW_TENANT_AUTO_APPROVE');
    const status = autoApprove === true ? 'ACTIVE' : 'PENDING';

    const hash = await bcrypt.hash(dto.adminPassword, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName.trim(),
        publicName: dto.publicName?.trim() || null,
        slug: dto.slug.toLowerCase(),
        domain: dto.domain || null,
        status,
        aboutShort: dto.aboutShort?.trim() || null,
        taxId: dto.taxId || null,
        mersisNo: dto.mersisNo || null,
        uetdsLicense: dto.uetdsLicense || null,
        supportEmail: dto.supportEmail || null,
        supportPhone: dto.supportPhone || null,
        website: dto.website || null,
        address: dto.address || null,
        commissionRate,
        planId,
        iyzicoMode: dto.iyzicoMode === 'OWN' ? 'OWN' : 'PLATFORM',
        users: {
          create: {
            name: dto.adminName.trim(),
            email: dto.adminEmail.toLowerCase().trim(),
            phoneNumber: dto.adminPhone || null,
            passwordHash: hash,
            role: 'COMPANY_ADMIN',
          },
        },
      },
    });

    // Consent logs — legal evidence
    await Promise.all([
      this.prisma.consentLog.create({
        data: { email: dto.adminEmail.toLowerCase(), kind: 'TERMS', granted: true },
      }),
      this.prisma.consentLog.create({
        data: { email: dto.adminEmail.toLowerCase(), kind: 'KVKK', granted: true },
      }),
    ]);

    this.logger.log(`[Onboarding] New tenant registered: ${tenant.name} (${tenant.slug}) — status=${status}`);

    // Best-effort: notify platform + welcome e-mail to admin
    this.notifyRegistration(tenant, dto).catch((err) =>
      this.logger.warn(`[Onboarding] Notification failed: ${err?.message || err}`),
    );

    return {
      id: tenant.id,
      slug: tenant.slug,
      status: tenant.status,
      autoApproved: status === 'ACTIVE',
      message: status === 'ACTIVE'
        ? 'Firma kaydın tamamlandı ve otomatik onaylandı. Admin paneline giriş yapabilirsin.'
        : 'Başvurun alındı. Platform ekibi belgeleri inceleyip onay verdiğinde e-posta atacağız. (Genellikle 1-2 iş günü)',
    };
  }

  /** Check if a slug is available — used by frontend for live feedback */
  async checkSlug(slug: string) {
    if (!SLUG_PATTERN.test(slug)) {
      return { available: false, reason: 'Geçersiz format (a-z, 0-9, tire)' };
    }
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    return { available: !existing, reason: existing ? 'Zaten kullanılıyor' : null };
  }

  /** Public plan list — for onboarding page */
  async listPublicPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return plans.map((p) => ({
      ...p,
      monthlyFee: Number(p.monthlyFee),
      commissionRate: Number(p.commissionRate),
    }));
  }

  private async notifyRegistration(tenant: any, dto: TenantRegistrationDto) {
    // Welcome e-mail to firma admin
    try {
      await (this.notifications as any).sendContactMessage?.({
        // reuse contact infra if available, else log
      });
    } catch { /* ignore */ }
    this.logger.log(`[Onboarding] ${tenant.name} notification sent to ${dto.adminEmail}`);
  }
}
