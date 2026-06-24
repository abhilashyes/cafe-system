# Running Project Brew locally

The whole **application** runs locally with **no cloud dependencies** — Cognito,
Razorpay, label printers, and the event bus are all mocked, and data is in-memory.
(AWS/Terraform in `apps/brew-infra` is only for deployment.)

## Prerequisites
- Node ≥ 20 and **pnpm 10** (`npm i -g pnpm`)
- For the mobile app only: the Flutter SDK
- `git`, and a terminal

## 1. Install
```bash
pnpm install
pnpm --filter @brew/contracts build   # shared types/SDK other packages depend on
```

## 2. Start the backend (API + KDS WebSocket + Swagger)
```bash
cp apps/brew-backend/.env.example apps/brew-backend/.env
pnpm --filter brew-backend start:dev
```
- API: http://localhost:3000 (all routes under `/v1`)
- Swagger UI: http://localhost:3000/docs
- Dev auth: any `Authorization: Bearer <token>` is accepted; OTP code is **`000000`**.

### Runtime profile (`BREW_PROFILE`)
The backend selects its adapters at one composition root by profile:

| `BREW_PROFILE` | Adapters | Use |
| --- | --- | --- |
| `demo` (default) | mock Cognito, mock Razorpay, in-memory data | local dev, CI, the GitHub Pages demo — no cloud needed |
| `live` | real Cognito/Razorpay (wired progressively in M2/M4) | staging/prod |

`demo` is the default, so a bare checkout runs the fully mocked system with zero
config. Real integrations are added **alongside** the mocks and selected by this
flag — the demo path is never removed, so the demo keeps working as live layers
land. The active profile is logged at boot (`Runtime profile: …`). Selecting
`live` before an integration's milestone is implemented fails loudly rather than
silently mocking.

**Authentication.** In `demo`, any `Bearer` token is accepted and you can spoof
roles with `x-mock-roles` / `x-mock-permissions` headers. In `live`, auth is
**Firebase Auth / Identity Platform**: clients run phone+OTP / email+MFA with the
Firebase SDK and send the resulting **ID token** as `Authorization: Bearer <jwt>`;
the backend verifies it (RS256 against Google's certs, `iss`/`aud`/`exp`) and maps
the token's `roles`/`permissions` custom claims onto the principal. Set
`FIREBASE_PROJECT_ID` for the live profile.

## 3. Verify the end-to-end flow (one command)
With the backend running, in another terminal:
```bash
node scripts/demo-flow.mjs
```
This walks the §12 demo — login → menu → dine-in order → UPI pay → webhook capture
→ loyalty accrual → GST invoice → ready → sales report — and prints each step.
Expected tail:
```
10. Sales report ...
   ✓ orders 1, revenue ₹451.50, COGS ₹81.00, profit ₹349.00
✅ Demo flow complete.
```

## 4. Run the POS + KDS web app
```bash
cp apps/brew-pos-web/.env.example apps/brew-pos-web/.env
pnpm --filter brew-pos-web dev        # http://localhost:5173
```
Open **two tabs**: `/order` and `/kds`. Place an order on `/order` → the ticket
appears on `/kds` in real time (WebSocket). Bump items; the last bump readies the order.

## 5. Run the global admin app
```bash
pnpm --filter brew-admin-global dev   # http://localhost:5174
```
(Placeholder screens for org/catalog/RBAC/loyalty/procurement/reporting/privacy.)

## 6. Run the KOT print agent (sample stickers)
```bash
pnpm --filter brew-kot-printer build && pnpm --filter brew-kot-printer start
```
Prints one ESC/POS and one ZPL sample sticker to stdout.

## 7. Run the Flutter customer app (needs Flutter SDK)
```bash
cd apps/brew-mobile-customer
flutter pub get
# Android emulator reaches the host at 10.0.2.2; iOS sim/web use localhost
flutter run --dart-define=BREW_API=http://10.0.2.2:3000
```
Login with any phone + OTP `000000` → menu → cart → place order + UPI → tracking.

## 8. Automated tests
```bash
pnpm test          # all packages (14 backend tests incl. e2e demo/feature flows)
pnpm lint          # type-check everything
pnpm build         # turbo build the whole workspace
```
Backend-only: `pnpm --filter brew-backend test`.

## Quick manual checks (curl)
```bash
curl -s localhost:3000/v1/health
curl -s -H 'authorization: Bearer dev' localhost:3000/v1/stores/store_1/menu
curl -s -H 'authorization: Bearer dev' localhost:3000/v1/loyalty/tiers
```

## Ports
| Service | URL |
| --- | --- |
| backend API + WebSocket | http://localhost:3000 (`/docs` for Swagger) |
| POS + KDS web | http://localhost:5173 |
| global admin web | http://localhost:5174 |

## Notes / current limits
- State is **in-memory** — restarting the backend resets all data.
- Mobile UPI uses the realistic intent flow; loyalty accrues server-side on the
  Razorpay **webhook** capture (the demo script and POS cash flow show accrual).
- Infra (`apps/brew-infra`) is for AWS deploys; see its `PREREQUISITES.md`.
