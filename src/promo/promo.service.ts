import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreatePromoDto {
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minBookingAmount?: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
}

export interface UpdatePromoDto {
  discountValue?: number;
  minBookingAmount?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  active?: boolean;
}

@Injectable()
export class PromoService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.promoCode.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }] },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  async create(tenantId: string, dto: CreatePromoDto) {
    const code = dto.code.toUpperCase().replace(/\s/g, '');
    if (code.length < 3 || code.length > 20) {
      throw new BadRequestException('Kod 3-20 karakter olmalı');
    }

    const existing = await this.prisma.promoCode.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('Bu kod zaten mevcut');

    return this.prisma.promoCode.create({
      data: {
        tenantId,
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minBookingAmount: dto.minBookingAmount ?? null,
        maxUses: dto.maxUses ?? null,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePromoDto) {
    const promo = await this.prisma.promoCode.findFirst({
      where: { id, OR: [{ tenantId }, { tenantId: null }] },
    });
    if (!promo) throw new NotFoundException('Promosyon kodu bulunamadı');

    const data: any = {};
    if (dto.discountValue !== undefined) data.discountValue = dto.discountValue;
    if (dto.minBookingAmount !== undefined) data.minBookingAmount = dto.minBookingAmount;
    if (dto.maxUses !== undefined) data.maxUses = dto.maxUses;
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);
    if (dto.active !== undefined) data.active = dto.active;

    return this.prisma.promoCode.update({ where: { id }, data });
  }

  async delete(tenantId: string, id: string) {
    const promo = await this.prisma.promoCode.findFirst({
      where: { id, OR: [{ tenantId }, { tenantId: null }] },
    });
    if (!promo) throw new NotFoundException('Promosyon kodu bulunamadı');
    await this.prisma.promoCode.delete({ where: { id } });
    return { ok: true };
  }

  async toggleActive(tenantId: string, id: string) {
    const promo = await this.prisma.promoCode.findFirst({
      where: { id, OR: [{ tenantId }, { tenantId: null }] },
    });
    if (!promo) throw new NotFoundException('Promosyon kodu bulunamadı');
    return this.prisma.promoCode.update({
      where: { id },
      data: { active: !promo.active },
    });
  }

  /**
   * Validate and calculate discount for a promo code at checkout.
   * Returns the discount amount or throws if invalid.
   */
  async applyCode(code: string, bookingAmount: number, userId: string) {
    const normalized = code.toUpperCase().replace(/\s/g, '');
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: normalized },
    });

    if (!promo) throw new BadRequestException('Geçersiz promosyon kodu');
    if (!promo.active) throw new BadRequestException('Bu kod artık aktif değil');

    const now = new Date();
    if (now < promo.validFrom) throw new BadRequestException('Bu kod henüz geçerli değil');
    if (now > promo.validUntil) throw new BadRequestException('Bu kodun süresi dolmuş');

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Bu kod kullanım limitine ulaşmış');
    }

    if (promo.minBookingAmount && bookingAmount < Number(promo.minBookingAmount)) {
      throw new BadRequestException(`Minimum sipariş tutarı: ₺${promo.minBookingAmount}`);
    }

    // Check if user already used this code
    const alreadyUsed = await this.prisma.promoCodeApplication.findFirst({
      where: { promoCodeId: promo.id, userId },
    });
    if (alreadyUsed) throw new BadRequestException('Bu kodu zaten kullandın');

    let discount: number;
    if (promo.discountType === 'PERCENT') {
      discount = Math.round(bookingAmount * Number(promo.discountValue) / 100 * 100) / 100;
    } else {
      discount = Math.min(Number(promo.discountValue), bookingAmount);
    }

    return {
      promoCodeId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discount,
      finalAmount: Math.max(0, bookingAmount - discount),
    };
  }
}
