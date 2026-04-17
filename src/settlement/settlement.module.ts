import { Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [SettlementService],
  controllers: [SettlementController],
  exports: [SettlementService],
})
export class SettlementModule {}
