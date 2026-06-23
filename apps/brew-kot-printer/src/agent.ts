import type { PrinterDevice, PrintJob } from '@brew/contracts';
import { driverFor } from './drivers';
import { PrintQueue } from './queue';

/**
 * Local print agent. Subscribes to print jobs from the KOT/Fulfilment service
 * over a secure channel (long-poll/WebSocket), routes each job to the right
 * station device, renders via the device's protocol driver, prints, and ACKs.
 *
 * Phase 0: a self-contained demo that prints two sample jobs (one ESC/POS,
 * one ZPL) to stdout instead of polling the backend.
 */
const devices: PrinterDevice[] = [
  { id: 'store_1:BAR', storeId: 'store_1', name: 'Bar (Epson)', protocol: 'ESC_POS', labelTemplate: 'cup-40x30' },
  { id: 'store_1:HOT_KITCHEN', storeId: 'store_1', name: 'Kitchen (Zebra)', protocol: 'ZPL', labelTemplate: 'food-58x40' },
];

const queue = new PrintQueue();

function sampleJob(deviceId: string, station: PrintJob['payload']['station']): PrintJob {
  return {
    id: `job_${deviceId}_${Date.now()}`,
    deviceId,
    status: 'QUEUED',
    attempts: 0,
    createdAt: new Date().toISOString(),
    payload: {
      orderId: 'ORDER123456',
      pickupCode: 'A7Q2',
      storeId: 'store_1',
      station,
      itemName: 'Caffè Latte',
      size: 'Grande',
      modifiers: ['Oat milk', 'Extra shot'],
      customerNameOrInitial: 'R',
      fulfilment: 'DINE_IN',
      tableNumber: '12',
      sequence: { index: 1, total: 2 },
      timestamp: new Date().toISOString(),
      barcode: 'ORDER123456',
    },
  };
}

async function processOnce(): Promise<void> {
  const job = queue.next();
  if (!job) return;
  const device = devices.find((d) => d.id === job.deviceId);
  if (!device) {
    queue.markFailed(job.id);
    return;
  }
  const driver = driverFor(device.protocol);
  try {
    const bytes = driver.render(job.payload);
    await driver.print(bytes);
    console.log(`\n--- printed to ${device.name} [${driver.protocol}] ---`);
    console.log(bytes.toString());
    queue.markPrinted(job.id);
    // In a full build: POST /v1/print-jobs/:id/ack { status: 'PRINTED' }.
  } catch {
    queue.markFailed(job.id);
  }
}

async function main(): Promise<void> {
  console.log('brew-kot-printer agent (Phase 0 demo)');
  queue.enqueue(sampleJob('store_1:BAR', 'BAR'));
  queue.enqueue(sampleJob('store_1:HOT_KITCHEN', 'HOT_KITCHEN'));
  while (queue.depth > 0) await processOnce();
  console.log('\nQueue drained. In production this polls the backend continuously.');
}

void main();
