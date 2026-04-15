import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import type { AuditAction, AuditEntity } from './audit.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @Request() req: any,
    @Query('entityType') entityType?: AuditEntity,
    @Query('entityId') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.audit.list(req.user.tenantId, {
      entityType,
      entityId,
      action,
      userId,
      from,
      to,
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 50,
    });
  }
}
