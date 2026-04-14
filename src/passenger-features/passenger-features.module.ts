import { Module } from '@nestjs/common';
import { PassengerFeaturesController } from './passenger-features.controller';
import { WalletService } from './wallet.service';
import { ReferralService } from './referral.service';
import { PriceAlertService } from './price-alert.service';
import { PriceHistoryService } from './price-history.service';
import { BadgesService } from './badges.service';
import { CarbonModule } from '../shared/carbon/carbon.module';

@Module({
  imports: [CarbonModule],
  controllers: [PassengerFeaturesController],
  providers: [
    WalletService,
    ReferralService,
    PriceAlertService,
    PriceHistoryService,
    BadgesService,
  ],
  exports: [
    WalletService,
    ReferralService,
    BadgesService,
  ],
})
export class PassengerFeaturesModule {}
