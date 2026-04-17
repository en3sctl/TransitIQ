import { Global, Module } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { SessionsService } from './sessions.service';
import { SecurityController } from './security.controller';
import { CommonModule } from '../common/common.module';

@Global()
@Module({
  imports: [CommonModule],
  providers: [TwoFactorService, SessionsService],
  controllers: [SecurityController],
  exports: [TwoFactorService, SessionsService],
})
export class SecurityModule {}
