# brew-kot-printer

Local **KOT sticker print agent** (§5.4). Runs on the in-store machine/network,
subscribes to print jobs from the KOT/Fulfilment service, and drives label
printers to produce **stackable stickers** affixed to cups and food packaging.

## Printer-agnostic by design

A `PrinterDriver` interface abstracts the device; the agent selects the protocol
per configured device so stores can mix vendors interchangeably:

- `EscPosDriver` → **ESC/POS** (Epson and compatibles)
- `ZplDriver` → **ZPL** (Zebra, TSC and compatibles)

Station routing (Bar → bar printer, food → kitchen, bakery → bakery) is driven by
the product→station mapping in Catalog and the device map here.

## Backend integration

The agent polls the KOT/Fulfilment service for queued jobs per station device,
renders each with the device's driver, prints, and ACKs the result:

1. `GET /v1/print-jobs?deviceId=<store>:<station>` → queued `PrintJob[]`
2. render `job.payload` via the device's driver (ESC/POS or ZPL) and print
3. `POST /v1/print-jobs/:id/ack { status: "PRINTED" | "FAILED" }`

**Resilience:** a job stays `QUEUED` on the backend until a `PRINTED` ack, so a
print failure (`FAILED`) or a connectivity drop just means it's retried on the
next poll — a ticket is never silently lost. A local dedupe set avoids
re-printing while an ACK is in flight.

## Run

```bash
pnpm --filter @brew/contracts build
pnpm --filter brew-kot-printer build

# live: poll the backend and drive the station printers
BREW_API=http://localhost:3000 pnpm --filter brew-kot-printer start

# drain once and exit (testing/CI)
KOT_ONCE=true BREW_API=http://localhost:3000 node dist/agent.js

# offline sample (no backend): print one ESC/POS + one ZPL sticker to stdout
KOT_DEMO=true node dist/agent.js
```

### Env vars
| Var | Default | Purpose |
| --- | --- | --- |
| `BREW_API` | `http://localhost:3000` | Backend base URL |
| `KOT_STORE` | `store_1` | Store this agent serves (drives device ids) |
| `KOT_TOKEN` | `kot-agent` | Bearer token (any value in dev) |
| `KOT_POLL_MS` | `2000` | Poll interval |
| `KOT_ONCE` | `false` | Single drain pass then exit |
| `KOT_DEMO` | `false` | Offline sample mode |

Station→printer mapping lives in `src/config.ts` (`devicesForStore`): Bar/Hot
Kitchen/Cold = Epson (ESC/POS), Bakery = Zebra (ZPL). The deviceId
(`<store>:<station>`) matches the backend's routing key.
