import { Module } from '@nestjs/common';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PromoController, AnalyticsController],
  providers: [PromoService, AnalyticsService],
  exports: [PromoService, AnalyticsService],
})
export class PromoModule {}
