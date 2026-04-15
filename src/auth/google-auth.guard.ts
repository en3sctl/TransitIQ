import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: any) {
    const req = context.switchToHttp().getRequest();
    const ref = req.query?.ref ? String(req.query.ref).slice(0, 32) : '';
    // Pass referral code through OAuth state so it survives the round-trip
    return { state: ref ? Buffer.from(`ref=${ref}`).toString('base64url') : undefined };
  }
}
