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

## Resilience

`PrintQueue` provides offline buffering, dedupe, retry on failure, and **manual
reprint** — a ticket is never silently lost.

## Run (Phase 0 demo)

```bash
pnpm --filter @brew/contracts build
pnpm --filter brew-kot-printer build && pnpm --filter brew-kot-printer start
# prints one ESC/POS and one ZPL sample sticker to stdout
```
