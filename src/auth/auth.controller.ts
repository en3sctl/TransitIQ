import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CustomerRegisterDto, CustomerLoginDto, GuestTicketLookupDto, UpdateProfileDto, ChangePasswordDto } from './dto/customer-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── B2B (Company Admin) ───

  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new company and admin user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with company credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ─── B2C (Passenger / Customer) ───

  @Post('customer/register')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new passenger account' })
  async customerRegister(@Body() dto: CustomerRegisterDto) {
    return this.authService.customerRegister(dto);
  }

  @Post('customer/login')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login as a passenger' })
  async customerLogin(@Body() dto: CustomerLoginDto) {
    return this.authService.customerLogin(dto);
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
