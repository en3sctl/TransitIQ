import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuditService } from './audit/audit.service';
import { AuditController } from './audit/audit.controller';

@Global()
@Module({
  providers: [PrismaService, AuditService],
  controllers: [AuditController],
  exports: [PrismaService, AuditService],
})
export class CommonModule {}
