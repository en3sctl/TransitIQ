import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TwoFactorService } from './two-factor.service';
import { SessionsService } from './sessions.service';

@ApiTags('Security')
@Controller()
export class SecurityController {
  constructor(
    private readonly twoFactor: TwoFactorService,
    private readonly sessions: SessionsService,
  ) {}

  // ─── 2FA ───

  @Get('security/2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  status(@Request() req: any) {
    return this.twoFactor.status(req.user.id);
  }

  @Post('security/2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  setup(@Request() req: any) {
    return this.twoFactor.setupBegin(req.user.id);
  }

  @Post('security/2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  verify(@Request() req: any, @Body() body: { code: string }) {
    return this.twoFactor.setupVerify(req.user.id, body.code);
  }

  @Post('security/2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  disable(@Request() req: any, @Body() body: { code: string }) {
    return this.twoFactor.disable(req.user.id, body.code);
  }

  // ─── Sessions ───

  @Get('security/sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  mySessions(@Request() req: any) {
    return this.sessions.list(req.user.id);
  }

  @Delete('security/sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  revokeOne(@Request() req: any, @Param('id') id: string) {
    return this.sessions.revokeOne(req.user.id, id);
  }

  @Post('security/sessions/revoke-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  revokeAll(@Request() req: any) {
    return this.sessions.revokeAll(req.user.id);
  }

  // ─── Super-admin session visibility ───

  @Get('super-admin/sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  superList(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    if (req.user.role !== 'SUPER_ADMIN') throw new ForbiddenException();
    return this.sessions.superAdminList({
      userId,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Post('super-admin/users/:id/revoke-sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  superRevokeAll(@Request() req: any, @Param('id') userId: string) {
    if (req.user.role !== 'SUPER_ADMIN') throw new ForbiddenException();
    return this.sessions.revokeAll(userId);
  }
}
