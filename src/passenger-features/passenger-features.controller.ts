import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { ReferralService } from './referral.service';
import { PriceAlertService } from './price-alert.service';
import { PriceHistoryService } from './price-history.service';
import { BadgesService } from './badges.service';
import { CarbonService } from '../shared/carbon/carbon.service';
import { ApplyReferralDto, CreatePriceAlertDto } from './dto/passenger-features.dto';

@ApiTags('Passenger Features')
@Controller()
export class PassengerFeaturesController {
  constructor(
    private wallet: WalletService,
    private referral: ReferralService,
    private priceAlert: PriceAlertService,
    private priceHistory: PriceHistoryService,
    private badges: BadgesService,
    private carbon: CarbonService,
  ) {}

  // ---------------- Wallet ----------------
  @Get('wallet/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async balance(@Request() req: any) {
    return this.wallet.getBalance(req.user.id);
  }

  @Get('wallet/transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async transactions(@Request() req: any) {
    return this.wallet.getTransactions(req.user.id);
  }

  // ---------------- Referral ----------------
  @Get('referral/code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async referralCode(@Request() req: any) {
    const code = await this.referral.getOrCreateCode(req.user.id);
    return { code };
  }

  @Get('referral/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async referralStats(@Request() req: any) {
    return this.referral.getStats(req.user.id);
  }

  @Post('referral/apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async applyReferral(@Request() req: any, @Body() dto: ApplyReferralDto) {
    await this.referral.attachReferrer(req.user.id, dto.code);
    return { ok: true };
  }

  // ---------------- Price Alerts ----------------
  @Post('price-alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createAlert(
    @Request() req: any,
    @Body() dto: CreatePriceAlertDto,
  ) {
    return this.priceAlert.create(req.user.id, dto);
  }

  @Get('price-alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listAlerts(@Request() req: any) {
    return this.priceAlert.list(req.user.id);
  }

  @Post('price-alerts/:id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async toggleAlert(@Request() req: any, @Param('id') id: string) {
    return this.priceAlert.toggle(req.user.id, id);
  }

  @Delete('price-alerts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteAlert(@Request() req: any, @Param('id') id: string) {
    return this.priceAlert.remove(req.user.id, id);
  }

  // ---------------- Price History (public) ----------------
  @Get('price-history')
  async priceHistoryGet(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('days') days?: string,
  ) {
    return this.priceHistory.forCityPair(from, to, days ? Number(days) : 30);
  }

  // ---------------- Badges ----------------
  @Get('badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listBadges(@Request() req: any) {
    return this.badges.listForUser(req.user.id);
  }

  // ---------------- Carbon (public) ----------------
  @Get('carbon')
  carbonGet(@Query('distanceKm') distanceKm: string) {
    return this.carbon.calculate(Number(distanceKm));
  }
}
