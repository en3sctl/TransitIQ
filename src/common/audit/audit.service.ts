import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEntity =
  | 'BOOKING' | 'TRIP' | 'VEHICLE' | 'STATION' | 'ROUTE' | 'DRIVER' | 'USER' | 'PAYMENT'
  | 'TENANT' | 'ANNOUNCEMENT';

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'BOOKING_CANCEL' | 'BOOKING_REFUND'
  | 'TRIP_REASSIGN_DRIVER' | 'TRIP_REASSIGN_VEHICLE' | 'TRIP_STATUS_CHANGE'
  | 'DRIVER_CREATE' | 'DRIVER_UPDATE' | 'DRIVER_DELETE'
  | 'PASSENGER_CHECK_IN' | 'PASSENGER_NO_SHOW'
  | 'SOS_TRIGGER' | 'PRE_TRIP_CHECK' | 'EXPENSE_CREATE' | 'EXPENSE_DELETE'
  // Super-admin / platform-level
  | 'TENANT_APPROVE' | 'TENANT_REJECT' | 'TENANT_SUSPEND' | 'TENANT_REACTIVATE'
  | 'IMPERSONATE_START' | 'IMPERSONATE_END'
  | 'USER_SUSPEND' | 'USER_UNSUSPEND' | 'USER_PASSWORD_RESET'
  | 'ANNOUNCEMENT_CREATE' | 'ANNOUNCEMENT_UPDATE' | 'ANNOUNCEMENT_DELETE';

/**
 * Central audit log for admin/driver/system-level mutations.
 * Fire-and-forget: never block the caller if logging fails.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId?: string | null;
    action: AuditAction;
    entityType: AuditEntity;
    entityId: string;
    oldValues?: any;
    newValues?: any;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: params.oldValues ?? undefined,
          newValues: params.newValues ?? undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`Audit log failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Admin: list audit logs for a tenant with filters.
   */
  async list(tenantId: string, params: {
    entityType?: AuditEntity;
    entityId?: string;
    action?: AuditAction;
    userId?: string;
    from?: string;
    to?: string;
    skip?: number;
    take?: number;
  }) {
    const { entityType, entityId, action, userId, from, to, skip = 0, take = 50 } = params;
    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    return { total, logs };
  }
}
