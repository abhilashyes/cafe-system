# brew-pos-web

In-store **POS + store admin + Kitchen Display Screen (KDS)** — React + TypeScript
(Vite). The in-store terminal experience (§5.2) and the wall-mounted KDS (§5.5).

## Screens

**Live (wired to the backend):**
- **Order Entry** (`/order`) — fetches the store menu, builds a cart, picks
  dine-in/takeaway (+ table), then **places the order and takes cash payment**
  (`createOrder` → `createPayment`). The order's tickets flow to the KDS/printers.
- **KDS** (`/kds`) — wall-mounted kitchen display. Connects to the **`/kds`
  WebSocket** for live ticket pushes (new orders + bumps), shows station lanes with
  elapsed-time SLA colour cues, and **bumps** items; bumping the last item marks the
  order ready (synced to the app/pickup board). Reconnects and re-snapshots on drop.

**Placeholders (§5.2):** Payments (UPI QR / card terminal) · Fulfilment · Store Ops
(open/close, 86, Z-report) · Inventory · Local Reports.

## Run

```bash
cp .env.example .env                 # VITE_API_BASE_URL, VITE_STORE_ID
pnpm --filter @brew/contracts build
pnpm --filter brew-backend start:dev # API + /kds WebSocket on :3000
pnpm --filter brew-pos-web dev       # http://localhost:5173
```

Open `/order` in one tab and `/kds` in another: placing an order makes a ticket
appear on the KDS in real time.

Staff auth is Cognito-backed (role-restricted) in a full build; dev uses a mock
token. All data access goes through published `/v1` APIs.
