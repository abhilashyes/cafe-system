import type { PrinterProtocol } from '@brew/contracts';

/** Agent configuration (env-overridable). */
export const config = {
  /** Backend base URL the agent polls for print jobs. */
  apiBase: process.env.BREW_API ?? 'http://localhost:3000',
  /** Cognito access token (any non-empty value in dev). */
  token: process.env.KOT_TOKEN ?? 'kot-agent',
  /** Poll interval in ms. */
  pollMs: Number(process.env.KOT_POLL_MS ?? 2000),
  /** Drain once and exit (useful for testing/CI). */
  once: process.env.KOT_ONCE === 'true',
  /** Offline sample mode (no backend) — prints two demo stickers. */
  demo: process.env.KOT_DEMO === 'true',
  /** Store this agent serves. */
  storeId: process.env.KOT_STORE ?? 'store_1',
};

export interface DeviceConfig {
  id: string;
  name: string;
  protocol: PrinterProtocol;
}

/**
 * Station → printer map for a store. Bar/kitchen/cold run Epson (ESC/POS) cup
 * printers; bakery runs a Zebra (ZPL) food-label printer. deviceId matches the
 * backend's `${storeId}:${station}` routing key.
 */
export function devicesForStore(storeId: string): DeviceConfig[] {
  return [
    { id: `${storeId}:BAR`, name: 'Bar (Epson)', protocol: 'ESC_POS' },
    { id: `${storeId}:HOT_KITCHEN`, name: 'Hot Kitchen (Epson)', protocol: 'ESC_POS' },
    { id: `${storeId}:COLD`, name: 'Cold (Epson)', protocol: 'ESC_POS' },
    { id: `${storeId}:BAKERY`, name: 'Bakery (Zebra)', protocol: 'ZPL' },
  ];
}
