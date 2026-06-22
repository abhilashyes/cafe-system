import type { PrinterProtocol } from '@brew/contracts';
import type { PrinterDriver } from './driver';
import { EscPosDriver } from './escpos.driver';
import { ZplDriver } from './zpl.driver';

/** Select a driver by the device's configured protocol. */
export function driverFor(protocol: PrinterProtocol): PrinterDriver {
  switch (protocol) {
    case 'ESC_POS':
      return new EscPosDriver();
    case 'ZPL':
      return new ZplDriver();
  }
}

export type { PrinterDriver } from './driver';
