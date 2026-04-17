import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OnboardingService } from './onboarding.service';
import type { TenantRegistrationDto } from './onboarding.service';

@ApiTags('Onboarding')
@Controller()
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Post('onboarding/tenant')
  @Throttle({ short: { limit: 3, ttl: 60000 }, medium: { limit: 10, ttl: 3600000 } })
  registerTenant(@Body() dto: TenantRegistrationDto) {
    return this.service.registerTenant(dto);
  }

  @Get('onboarding/check-slug')
  @Throttle({ short: { limit: 30, ttl: 10000 } })
  checkSlug(@Query('slug') slug: string) {
    return this.service.checkSlug((slug || '').toLowerCase().trim());
  }

  @Get('onboarding/plans')
  @Throttle({ short: { limit: 30, ttl: 10000 } })
  listPlans() {
    return this.service.listPublicPlans();
  }
}
