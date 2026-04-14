import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [TasksService],
})
export class TasksModule {}
