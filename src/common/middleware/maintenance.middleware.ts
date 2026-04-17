import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { OperationsService } from '../../operations/operations.service';

/**
 * Blocks most mutating requests when MAINTENANCE_MODE is on. Read endpoints
 * and super-admin routes remain accessible so platform operators can fix
 * things mid-maintenance.
 */
@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private operations: OperationsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only block POST/PATCH/PUT/DELETE
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Always allow these paths (super-admin needs to toggle off + auth + onboarding)
    const allowedPrefixes = [
      '/auth/', '/super-admin/', '/health', '/platform/maintenance',
      '/onboarding/', // yeni firma başvuruları her zaman alınmalı
      '/security/', // 2FA kurulum / oturum yönetimi
      '/compliance/tickets', // destek talepleri (public)
    ];
    if (allowedPrefixes.some((p) => req.path.startsWith(p))) {
      return next();
    }

    try {
      const on = await this.operations.getSetting('MAINTENANCE_MODE');
      if (on === true) {
        const message = await this.operations.getSetting('MAINTENANCE_MESSAGE');
        throw new ServiceUnavailableException(message || 'Sistem bakımda, kısa süre içinde geri döneceğiz.');
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      // If setting read fails, don't block traffic
    }

    next();
  }
}
