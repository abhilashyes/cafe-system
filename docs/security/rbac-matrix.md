# RBAC Matrix — Project Brew

Roles are **configurable** (seeded, not hard-coded). Permissions are granular and
enforced **server-side** on every endpoint; scope follows the org hierarchy. The
seed permission sets live in `brew-backend` `IdentityService`.

Legend: ✓ = allowed (within scope). Scope: Store / Region / Org.

| Permission \ Role | Customer | Cashier | Barista | Shift Sup. | Store Mgr | Regional Mgr | Inv. Mgr | Finance | Privacy Officer | Super Admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| order:create | ✓ | ✓ | | | ✓ | | | | | ✓ |
| order:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| order:update | | ✓ | ✓ | ✓ | ✓ | | | | | ✓ |
| payment:create | ✓ | ✓ | | | ✓ | | | | | ✓ |
| refund:approve | | | | ✓ | ✓ | ✓ | | | | ✓ |
| kds:bump | | | ✓ | ✓ | ✓ | | | | | ✓ |
| inventory:read | | | | ✓ | ✓ | ✓ | ✓ | | | ✓ |
| inventory:write | | | | ✓ | ✓ | | ✓ | | | ✓ |
| po:create / po:approve | | | | | | ✓ | ✓ | | | ✓ |
| store:manage | | | | | | ✓ | | | | ✓ |
| report:read:store | | | | | ✓ | ✓ | | | | ✓ |
| report:read:region | | | | | | ✓ | | | | ✓ |
| report:read:org / report:export | | | | | | | | ✓ | | ✓ |
| privacy:dsr:manage / privacy:audit:read | | | | | | | | | ✓ | ✓ |

## Scoping rules
- Store Manager: own **store** only. Regional Manager: own **region**.
- Finance/Reporting: org-wide read, no operational write.
- Privacy Officer (DPO): DSR handling + audit access; no operational write.
- Super Admin: all (use sparingly; actions audited).
- Every privileged action is audit-logged (who/what/when/where).
