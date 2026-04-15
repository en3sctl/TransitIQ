import { Module } from '@nestjs/common';
import { OtogarService } from './otogar.service';
import { OtogarController } from './otogar.controller';

@Module({
  providers: [OtogarService],
  controllers: [OtogarController],
  exports: [OtogarService],
})
export class OtogarModule {}
