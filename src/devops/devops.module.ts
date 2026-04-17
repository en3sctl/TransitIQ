import { Global, Module } from '@nestjs/common';
import { DevopsService } from './devops.service';
import { DevopsController } from './devops.controller';
import { CommonModule } from '../common/common.module';

@Global()
@Module({
  imports: [CommonModule],
  providers: [DevopsService],
  controllers: [DevopsController],
  exports: [DevopsService],
})
export class DevopsModule {}
