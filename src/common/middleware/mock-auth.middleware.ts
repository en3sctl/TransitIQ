import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MockAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Injecting a mock user for development/testing
    (req as any).user = {
      id: 'test-admin-id',
      tenantId: 'test-firma-123',
      role: 'COMPANY_ADMIN',
    };
    next();
  }
}
