import { Module, Global } from '@nestjs/common';
import { CarbonService } from './carbon.service';

@Global()
@Module({
  providers: [CarbonService],
  exports: [CarbonService],
})
export class CarbonModule {}
