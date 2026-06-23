# brew-admin-global

Head-office **global admin dashboard** — React + TypeScript (Vite). Org-wide
config, catalog/recipes, RBAC, loyalty configuration (5 tiers + points), procurement,
org-wide analytics, and privacy administration (§5.3).

> Phase 0: placeholder screens wired to `@brew/contracts`.

## Run

```bash
pnpm --filter @brew/contracts build
pnpm --filter brew-admin-global dev    # http://localhost:5174
```

Access is RBAC-restricted (Regional Manager sees their region, Super Admin sees all).
All data flows through published `/v1` APIs.
