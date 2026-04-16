import { Module } from '@nestjs/common';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PromoController],
  providers: [PromoService],
  exports: [PromoService],
})
export class PromoModule {}
