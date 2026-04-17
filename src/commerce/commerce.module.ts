import { Module } from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { CommerceController } from './commerce.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [CommerceService],
  controllers: [CommerceController],
  exports: [CommerceService],
})
export class CommerceModule {}
