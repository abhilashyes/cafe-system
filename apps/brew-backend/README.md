# brew-backend

Project Brew backend — a **NestJS modular monolith**. Each domain is a module
with its own controller/service/events, owning its data and communicating via the
`EventBus` + published contracts, so any module can later be **extracted into its
own service** without redesign.

> Phase 0: business logic is shallow and adapters are **mocked**. No real
> AWS/Razorpay calls are made.

## Modules (→ future services)

| Module | Responsibility |
| --- | --- |
| `identity` | Cognito phone+OTP (via `AuthAdapter`), RBAC roles |
| `catalog` | Products, modifiers, recipes (BOM), GST/HSN, store availability |
| `ordering` | Cart/order lifecycle, dine-in/takeaway, pre-order → emits `OrderPlaced` |
| `payments` | Razorpay (via `PaymentAdapter`), idempotency, webhook verify, refunds |
| `inventory` | Recipe-based deduction (on `OrderPlaced`), wastage, POs, transfers |
| `loyalty` | Stars ledger + 5 tiers; accrues on `PaymentCaptured` |
| `kot` | KOT sticker payloads, station print jobs, KDS state |
| `reporting` | Sales, profit (COGS from BOM), unit economics |
| `notifications` | SMS/push/email; marketing gated on DPDP consent |
| `privacy` | Consent ledger + Data Subject Requests (DPDP) |

## Cross-cutting (`src/common`)

- `auth/cognito.guard.ts` — validates Cognito JWT at the edge (mock in dev).
- `auth/rbac.ts` — `@RequirePermissions()` + server-side `RbacGuard`.
- `audit/audit.interceptor.ts` — tamper-evident audit log of every request.
- `events/event-bus.ts` — in-memory pub/sub (EventBridge/SNS+SQS in prod).
- `adapters/` — `AuthAdapter` (Cognito) and `PaymentAdapter` (Razorpay) ports + mocks.

## Run

```bash
cp .env.example .env
pnpm --filter @brew/contracts build      # contracts must build first
pnpm --filter brew-backend start:dev     # http://localhost:3000, Swagger at /docs
pnpm --filter brew-backend test          # jest
pnpm --filter brew-backend seed          # prints the §12 demo flow
```

## Auth in dev

`AUTH_ADAPTER=mock` (default): any `Authorization: Bearer <token>` is accepted;
OTP code is `000000`. Swap to real Cognito/Razorpay by providing prod adapters
and the env in `.env.example`.
