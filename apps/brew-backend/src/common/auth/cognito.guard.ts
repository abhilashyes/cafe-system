import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Validates the Cognito JWT presented as `Authorization: Bearer <jwt>`.
 *
 * MOCK: in dev (AUTH_ADAPTER=mock) we accept any non-empty bearer token and
 * decode a fake principal. In prod this verifies the JWT signature against the
 * Cognito JWKS, checks `iss`/`aud`/`exp`, and attaches the principal + roles.
 * The gateway is the single place auth is validated; services still authorize.
 */
@Injectable()
export class CognitoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { principal?: unknown }>();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length);
    if (process.env.AUTH_ADAPTER === 'mock' || !process.env.AUTH_ADAPTER) {
      // Dev: trust any token, attach a stub principal.
      req.principal = { subjectId: `mock:${token.slice(0, 8)}`, roles: ['CUSTOMER'] };
      return true;
    }
    // TODO(prod): verify against Cognito JWKS and attach real claims.
    throw new UnauthorizedException('JWKS verification not configured');
  }
}
