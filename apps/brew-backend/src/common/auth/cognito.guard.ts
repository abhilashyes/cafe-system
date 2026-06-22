import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/** Broad permission set granted to the mock principal so dev flows aren't 403'd. */
const DEV_PERMISSIONS = [
  'order:create',
  'order:read',
  'order:update',
  'payment:create',
  'refund:approve',
  'loyalty:read',
  'kds:bump',
  'inventory:read',
  'inventory:write',
  'report:read:store',
  'report:read:region',
  'report:read:org',
  'report:export',
];

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
      // Dev: trust any token, attach a stub principal. Tests/clients can override
      // the granted roles/permissions to exercise RBAC via headers.
      const roles = this.csv(req.headers['x-mock-roles']) ?? ['CUSTOMER'];
      const permissions = this.csv(req.headers['x-mock-permissions']) ?? DEV_PERMISSIONS;
      req.principal = { subjectId: `mock:${token.slice(0, 8)}`, roles, permissions };
      return true;
    }
    // TODO(prod): verify against Cognito JWKS and attach real claims.
    throw new UnauthorizedException('JWKS verification not configured');
  }

  private csv(value: string | string[] | undefined): string[] | undefined {
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    return value.split(',').map((s) => s.trim());
  }
}
