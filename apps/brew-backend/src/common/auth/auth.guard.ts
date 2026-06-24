import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TokenVerifier } from './token-verifier';
import type { Principal } from './principal';

/**
 * Single place auth is validated: requires `Authorization: Bearer <token>`,
 * delegates verification to the profile-selected {@link TokenVerifier} (mock in
 * demo, Firebase/Identity Platform in live), and attaches the resolved principal
 * to the request. Services still enforce RBAC server-side (see RbacGuard).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly verifier: TokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { principal?: Principal }>();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    try {
      req.principal = await this.verifier.verify(header.slice('Bearer '.length), req);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
}
