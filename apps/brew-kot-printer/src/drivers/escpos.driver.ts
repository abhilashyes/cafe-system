import type { KotStickerPayload } from '@brew/contracts';
import type { PrinterDriver } from './driver';

/** ESC/POS driver (Epson and compatibles). Render is a stub command stream. */
export class EscPosDriver implements PrinterDriver {
  readonly protocol = 'ESC_POS' as const;

  render(p: KotStickerPayload): Buffer {
    const ESC = '\x1b';
    const lines = [
      `${ESC}@`, // init
      `${ESC}!\x38${p.pickupCode}  #${p.orderId.slice(0, 6)}`, // double height/width
      `${ESC}!\x00${p.itemName}${p.size ? ` (${p.size})` : ''}`,
      ...p.modifiers.map((m) => `  + ${m}`),
      `${p.fulfilment}${p.tableNumber ? ` T${p.tableNumber}` : ''}  ${p.sequence.index}/${p.sequence.total}`,
      `${p.customerNameOrInitial ?? ''}  ${p.station}`,
      '\x1d\x56\x00', // full cut
    ];
    return Buffer.from(lines.join('\n'), 'binary');
  }

  async print(_bytes: Buffer): Promise<void> {
    // TODO: write to USB/serial/network device. Mocked here.
  }
}
