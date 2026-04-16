import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Allows both authenticated AND anonymous requests through.
 * If a valid JWT is present, req.user is populated.
 * If not, req.user is null and the request still proceeds.
 * Use this on endpoints that support both guest and logged-in flows (e.g. checkout).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Never throw — just return user (null if not authed)
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
