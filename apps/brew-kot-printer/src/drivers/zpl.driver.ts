import type { KotStickerPayload } from '@brew/contracts';
import type { PrinterDriver } from './driver';

/** ZPL driver (Zebra, TSC and compatibles). Render is a stub ZPL label. */
export class ZplDriver implements PrinterDriver {
  readonly protocol = 'ZPL' as const;

  render(p: KotStickerPayload): Buffer {
    const zpl = [
      '^XA',
      `^CF0,40^FO20,20^FD${p.pickupCode} #${p.orderId.slice(0, 6)}^FS`,
      `^CF0,30^FO20,70^FD${p.itemName}${p.size ? ` (${p.size})` : ''}^FS`,
      ...p.modifiers.map((m, i) => `^CF0,22^FO40,${110 + i * 26}^FD+ ${m}^FS`),
      `^CF0,24^FO20,200^FD${p.fulfilment}${p.tableNumber ? ` T${p.tableNumber}` : ''} ${p.sequence.index}/${p.sequence.total}^FS`,
      p.barcode ? `^FO20,240^BQN,2,4^FDLA,${p.barcode}^FS` : '',
      '^XZ',
    ];
    return Buffer.from(zpl.filter(Boolean).join('\n'), 'utf8');
  }

  async print(_bytes: Buffer): Promise<void> {
    // TODO: write to USB/serial/network device. Mocked here.
  }
}
