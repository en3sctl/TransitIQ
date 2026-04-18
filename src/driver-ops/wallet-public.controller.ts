import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { DriverOpsService } from './driver-ops.service';

/**
 * Public endpoint — auth'suz erişim.
 * Trafik polisi QR tarayınca bu URL'e gider, tokenla belgeler gösterilir.
 */
@ApiTags('Driver Wallet (Public)')
@Controller('driver-wallet')
export class DriverWalletPublicController {
  constructor(private readonly driverOps: DriverOpsService) {}

  @Get(':token')
  @Throttle({ short: { limit: 30, ttl: 60000 } })
  getByToken(@Param('token') token: string) {
    return this.driverOps.getWalletByToken(token);
  }
}
