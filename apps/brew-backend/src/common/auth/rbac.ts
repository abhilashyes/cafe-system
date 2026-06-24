import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Principal } from './principal';

export const PERMISSIONS_KEY = 'required_permissions';

/** Decorate a handler with the granular permissions it requires. */
export const RequirePermissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);

/**
 * Least-privilege RBAC enforced server-side on every protected endpoint
 * (never trust the client). Scoping to the org hierarchy (store/region) is
 * applied in services using the principal's role assignments.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { principal?: Principal }>();
    const granted = new Set(req.principal?.permissions ?? []);
    // Dev convenience: SUPER_ADMIN passes everything.
    if (req.principal?.roles?.includes('SUPER_ADMIN')) return true;

    const ok = required.every((p) => granted.has(p));
    if (!ok) throw new ForbiddenException(`Missing permission(s): ${required.join(', ')}`);
    return true;
  }
}
