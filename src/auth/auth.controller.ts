import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, Req, Ip, Res, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { TurnstileService } from './turnstile.service';
import { LoginDto, RegisterDto, PasswordResetRequestDto, PasswordResetConfirmDto, EmailVerifyConfirmDto, TwoFactorLoginDto } from './dto/auth.dto';
import { CustomerRegisterDto, CustomerLoginDto, GuestTicketLookupDto, UpdateProfileDto, ChangePasswordDto } from './dto/customer-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

function resolveClientIp(req: any): string {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '';
}

function resolveUserAgent(req: any): string {
  return (req.headers?.['user-agent'] || '').toString().slice(0, 500);
}

const REFRESH_COOKIE_NAME = 'tiq_rt';

/**
 * Refresh token cookie ayarları:
 * - httpOnly: JS erişemez (XSS hardening)
 * - secure: HTTPS-only (prod)
 * - sameSite: 'lax' — same-origin POST'larda gönderilir, third-party'den gönderilmez (CSRF hardening)
 * - path: '/auth' — sadece auth endpoint'lerine gönderilir (genel istek trafiğine bulaşmaz)
 * - maxAge: 30 gün
 */
function refreshCookieOptions(prod: boolean) {
  return {
    httpOnly: true,
    secure: prod,
    sameSite: 'lax' as const,
    path: '/auth',
    maxAge: 30 * 24 * 3600 * 1000,
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly turnstile: TurnstileService,
  ) {}

  // ─── B2B (Company Admin) ───

  /**
   * Refresh token'ı response body'den çıkarıp httpOnly cookie'ye yazar.
   * Body'de `access_token` + `user` döndürülür (eski client uyumlu).
   */
  private writeRefreshCookie(res: Response, refreshToken: string) {
    const prod = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(prod));
  }

  private clearRefreshCookie(res: Response) {
    const prod = this.config.get<string>('NODE_ENV') === 'production';
    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(prod), maxAge: 0 });
  }

  /**
   * Login sonucunu response'a yazar. Hesapta 2FA açıksa oturum HENÜZ
   * açılmaz: refresh cookie yazılmaz, access token dönmez — sadece kod
   * adımını yetkilendiren challenge döner.
   */
  private finishLogin(res: Response, result: Awaited<ReturnType<AuthService['login']>>) {
    if ('requires2FA' in result) {
      return {
        requires2FA: true,
        challengeToken: result.challengeToken,
        expiresInSec: result.expiresInSec,
      };
    }
    this.writeRefreshCookie(res, result.refresh_token);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new company and admin user' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.turnstile.verify(registerDto.turnstileToken, resolveClientIp(req));
    const result = await this.authService.register(registerDto, resolveClientIp(req), resolveUserAgent(req));
    this.writeRefreshCookie(res, result.refresh_token);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with company credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.turnstile.verify(loginDto.turnstileToken, resolveClientIp(req));
    const result = await this.authService.login(loginDto, resolveClientIp(req), resolveUserAgent(req));
    return this.finishLogin(res, result);
  }

  /**
   * Login'in ikinci adımı. Parola adımı 2FA açık bir hesapta durduysa
   * client buraya challenge token + kod gönderir; oturum burada açılır.
   */
  @Post('2fa/login')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Complete login by verifying a 2FA code' })
  async twoFactorLogin(
    @Body() dto: TwoFactorLoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyTwoFactorLogin(
      dto.challengeToken,
      dto.code,
      resolveClientIp(req),
      resolveUserAgent(req),
    );
    this.writeRefreshCookie(res, result.refresh_token);
    return { access_token: result.access_token, user: result.user };
  }

  // ─── B2C (Passenger / Customer) ───

  @Post('customer/register')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new passenger account' })
  async customerRegister(
    @Body() dto: CustomerRegisterDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.turnstile.verify(dto.turnstileToken, resolveClientIp(req));
    const result = await this.authService.customerRegister(dto, resolveClientIp(req), resolveUserAgent(req));
    this.writeRefreshCookie(res, result.refresh_token);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('customer/login')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login as a passenger' })
  async customerLogin(
    @Body() dto: CustomerLoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.turnstile.verify(dto.turnstileToken, resolveClientIp(req));
    const result = await this.authService.customerLogin(dto, resolveClientIp(req), resolveUserAgent(req));
    return this.finishLogin(res, result);
  }

  // ─── Refresh + Logout ───

  @Post('refresh')
  @SkipThrottle() // sık çağrılır (her access expire'da), throttle UX'i bozar
  @ApiOperation({ summary: 'Rotate refresh token, return fresh access token' })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = (req as any).cookies || {};
    const refreshToken = cookies[REFRESH_COOKIE_NAME];
    const result = await this.authService.refreshTokens(refreshToken, {
      ip: resolveClientIp(req),
      ua: resolveUserAgent(req),
    });
    this.writeRefreshCookie(res, result.refresh_token);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('logout')
  @SkipThrottle()
  @ApiOperation({ summary: 'Revoke refresh token + clear cookie' })
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const cookies = (req as any).cookies || {};
    await this.authService.logout(cookies[REFRESH_COOKIE_NAME]);
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  // ─── Google OAuth ───

  @Get('google')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Begin Google OAuth flow' })
  async googleAuth() {
    // Guard handles the redirect to Google
  }

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: any, @Res() res: Response, @Query('state') state?: string) {
    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    try {
      let referralCode: string | undefined;
      if (state) {
        try {
          const decoded = Buffer.from(state, 'base64url').toString('utf8');
          const match = decoded.match(/^ref=(.+)$/);
          if (match) referralCode = match[1];
        } catch {
          // ignore bad state
        }
      }

      const result = await this.authService.loginWithGoogle(
        req.user,
        referralCode,
        resolveClientIp(req),
        resolveUserAgent(req),
      );
      // 2FA açıksa Google doğrulaması tek başına yetmez — kod adımına yolla
      if ('requires2FA' in result) {
        return res.redirect(
          `${frontend}/hesap/giris?challenge=${encodeURIComponent(result.challengeToken)}`,
        );
      }
      // Refresh token redirect ile birlikte set-cookie olarak browser'a düşer (URL'de görünmez)
      this.writeRefreshCookie(res, result.refresh_token);
      const payload = Buffer.from(JSON.stringify({ token: result.access_token, user: result.user })).toString('base64url');
      return res.redirect(`${frontend}/google-callback#d=${payload}`);
    } catch (e: any) {
      const msg = encodeURIComponent(e?.message || 'Google ile giriş başarısız');
      return res.redirect(`${frontend}/login?error=${msg}`);
    }
  }

  // ─── Password Reset ───

  @Post('password-reset/request')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password-reset/confirm')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirm password reset with token' })
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto.token, dto.newPassword);
  }

  // ─── Email Verification ───

  @Post('verify-email/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 2, ttl: 60000 } })
  async sendEmailVerification(@Request() req: any) {
    return this.authService.sendEmailVerification(req.user.id);
  }

  @Post('verify-email/confirm')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async confirmEmailVerification(@Body() dto: EmailVerifyConfirmDto) {
    return this.authService.confirmEmailVerification(dto.token);
  }

  @Post('customer/lookup')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Guest PNR lookup with email verification' })
  async guestLookup(@Body() dto: GuestTicketLookupDto) {
    return this.authService.guestTicketLookup(dto);
  }

  @Get('customer/bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in user bookings' })
  async getMyBookings(@Request() req: any) {
    return this.authService.getUserBookings(req.user.id);
  }

  @Get('customer/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile + stats' })
  async getProfile(@Request() req: any) {
    return this.authService.getCustomerProfile(req.user.id);
  }

  @Patch('customer/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (name, phone)' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateCustomerProfile(req.user.id, dto);
  }

  @Post('customer/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changeCustomerPassword(req.user.id, dto);
  }

  @Post('customer/bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Cancel own booking (customer-initiated)' })
  async cancelMyBooking(@Request() req: any, @Param('id') id: string) {
    return this.authService.cancelOwnBooking(req.user.id, id);
  }
}
