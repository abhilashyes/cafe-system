import { Injectable } from '@nestjs/common';
import type { Role, RoleKey } from '@brew/contracts';
import { AuthAdapter } from '../../common/adapters/auth.adapter';

/** Identity & Access — Cognito (via AuthAdapter) + RBAC roles. */
@Injectable()
export class IdentityService {
  /** Seed roles are configurable, not hard-coded — this is the default seed set. */
  private readonly roles: Role[] = (
    [
      ['CUSTOMER', ['order:create', 'order:read', 'payment:create', 'loyalty:read']],
      ['CASHIER', ['order:create', 'order:read', 'order:update', 'payment:create']],
      ['BARISTA', ['order:read', 'order:update', 'kds:bump']],
      ['SHIFT_SUPERVISOR', ['order:update', 'refund:approve', 'inventory:write']],
      ['STORE_MANAGER', ['report:read:store', 'inventory:write', 'refund:approve']],
      ['REGIONAL_MANAGER', ['report:read:region', 'store:manage']],
      ['INVENTORY_MANAGER', ['inventory:write', 'po:create', 'po:approve']],
      ['FINANCE_ANALYST', ['report:read:org', 'report:export']],
      ['PRIVACY_OFFICER', ['privacy:dsr:manage', 'privacy:audit:read']],
      ['SUPER_ADMIN', ['*']],
    ] as Array<[RoleKey, string[]]>
  ).map(([key, permissions], i) => ({ id: `role_${i + 1}`, key, name: key, permissions }));

  constructor(private readonly auth: AuthAdapter) {}

  startOtp(phone: string) {
    return this.auth.startOtp(phone);
  }

  verifyOtp(phone: string, code: string) {
    return this.auth.verifyOtp(phone, code);
  }

  listRoles(): Role[] {
    return this.roles;
  }
}
