import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PromoService } from './promo.service';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreatePromoDto, UpdatePromoDto } from './promo.service';

@ApiTags('Promo Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('promo-codes')
export class PromoController {
  constructor(
    private readonly promoService: PromoService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(@Request() req: any) {
    return this.promoService.findAll(req.user.tenantId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreatePromoDto) {
    return this.promoService.create(req.user.tenantId, dto);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promoService.update(req.user.tenantId, id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Request() req: any, @Param('id') id: string) {
    return this.promoService.toggleActive(req.user.tenantId, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.promoService.delete(req.user.tenantId, id);
  }

  @Post('apply')
  async apply(
    @Request() req: any,
    @Body() body: { code: string; tripId?: string; seats?: number; amount?: number },
  ) {
    // PREFERRED: client sends tripId + seats → server computes amount from DB.
    // FALLBACK: client amount is used but capped to a sane max to prevent abuse.
    let amount = Number(body.amount) || 0;

    if (body.tripId && body.seats) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: body.tripId },
        include: { route: true },
      });
      if (trip) {
        amount = Math.round(Number(trip.route.basePrice) * Math.max(1, Math.min(10, body.seats)) * 100) / 100;
      }
    }

    // Hard cap — no booking should be > 50k TL
    amount = Math.min(amount, 50000);

    return this.promoService.applyCode(body.code, amount, req.user.id);
  }
}
