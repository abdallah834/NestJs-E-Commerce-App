// IP-based limiting punishes shared IPs (offices, NAT, mobile carriers) and under-punishes attackers who rotate IPs. For authenticated routes, keying off the user ID is more accurate. This guard uses user.id when a request is authenticated, and falls back to IP for anonymous traffic.

import { Injectable, Req } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import type { IAuthenticationRequest } from 'src/common/interfaces';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(
    @Req() req: IAuthenticationRequest,
  ): Promise<string> {
    const userId = req?.credentials?.userAccount.id;

    return Promise.resolve(
      userId ? `user-${userId}` : req.ip,
    ) as Promise<string>;
  }

  // Optional: skip throttling entirely for trusted internal calls
  // (e.g. requests carrying a verified webhook signature header).
  protected async shouldSkip(
    context: ThrottlerRequest['context'],
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest<IAuthenticationRequest>();

    return Promise.resolve(
      req.headers['x-internal-service-token'] ===
        process.env.INTERNAL_SERVICE_TOKEN
        ? true
        : false,
    );
  }
}
