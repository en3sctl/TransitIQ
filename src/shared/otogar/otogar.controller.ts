import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OtogarService } from './otogar.service';

@ApiTags('Otogar Lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stations/lookup')
export class OtogarController {
  constructor(private readonly otogar: OtogarService) {}

  /** Admin: search real-world bus stations in OSM for a given city. */
  @Get('otogar')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async search(@Query('city') city: string) {
    return this.otogar.searchByCity(city || '');
  }
}
