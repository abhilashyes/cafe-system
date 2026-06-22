import type { KotStickerPayload, PrinterProtocol } from '@brew/contracts';

/**
 * Printer-agnostic driver port. Stores can mix Epson (ESC/POS), Zebra/TSC (ZPL),
 * etc. — the agent selects the protocol per configured device.
 */
export interface PrinterDriver {
  readonly protocol: PrinterProtocol;
  /** Render a sticker payload into the printer's native command bytes. */
  render(payload: KotStickerPayload): Buffer;
  /** Send bytes to the device (USB/serial/network). */
  print(bytes: Buffer): Promise<void>;
}
