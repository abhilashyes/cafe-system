# brew-pos-web

In-store **POS + store admin + Kitchen Display Screen (KDS)** — React + TypeScript
(Vite). The in-store terminal experience (§5.2) and the wall-mounted KDS (§5.5).

> Phase 0: placeholder screens wired to the `@brew/contracts` SDK. No real auth/UI.

## Screens (placeholders)

Order Entry · Payments (UPI QR / card / cash) · Fulfilment (bump bar) ·
**KDS** (station lanes + SLA cues) · Store Ops (open/close, 86, Z-report) ·
Inventory · Local Reports.

## Run

```bash
cp .env.example .env
pnpm --filter @brew/contracts build
pnpm --filter brew-pos-web dev      # http://localhost:5173
```

Staff auth is Cognito-backed (role-restricted) in a full build; dev uses a mock
token. All data access goes through published `/v1` APIs.
