import { Module } from '@nestjs/common';
import { AdminSearchService } from './admin-search.service';
import { AdminSearchController } from './admin-search.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [AdminSearchService],
  controllers: [AdminSearchController],
})
export class AdminSearchModule {}
