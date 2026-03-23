import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * DEVELOPMENT ONLY - Mock auth middleware.
 * Injects a test user for endpoints that need req.user but are hit without JWT.
 * NEVER enable in production.
 */
@Injectable()
export class MockAuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'production') {
      return next();
    }

    // Only inject if no real user is present (JWT guard didn't run)
    if (!(req as any).user) {
      (req as any).user = {
        id: 'test-admin-id',
        tenantId: 'test-firma-123',
        role: 'COMPANY_ADMIN',
      };
    }
    next();
  }
}
