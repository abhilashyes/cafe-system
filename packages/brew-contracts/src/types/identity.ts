import type { Id } from './hierarchy';

/** Seed roles are configurable in global admin, not hard-coded. */
export type RoleKey =
  | 'CUSTOMER'
  | 'CASHIER'
  | 'BARISTA'
  | 'SHIFT_SUPERVISOR'
  | 'STORE_MANAGER'
  | 'REGIONAL_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'FINANCE_ANALYST'
  | 'PRIVACY_OFFICER'
  | 'SUPER_ADMIN';

/** Permissions are granular strings, e.g. "order:create", "refund:approve". */
export type Permission = string;

export interface Role {
  id: Id;
  key: RoleKey;
  name: string;
  permissions: Permission[];
}

/** Scope binds a role assignment to a node in the org hierarchy. */
export interface RoleAssignment {
  roleId: Id;
  scope: { level: 'ORG' | 'REGION' | 'STORE'; nodeId: Id };
}

export interface StaffAccount {
  id: Id;
  /** Cognito sub. */
  subjectId: string;
  phone: string;
  name: string;
  assignments: RoleAssignment[];
}

export interface CustomerAccount {
  id: Id;
  subjectId: string;
  phone: string;
  name?: string;
}
