import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PromoService } from './promo.service';
import type { CreatePromoDto, UpdatePromoDto } from './promo.service';

@ApiTags('Promo Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('promo-codes')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

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
  apply(@Request() req: any, @Body() body: { code: string; amount: number }) {
    return this.promoService.applyCode(body.code, body.amount, req.user.id);
  }
}
