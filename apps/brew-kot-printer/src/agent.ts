import type { PrintJob, PrinterProtocol } from '@brew/contracts';
import { config, devicesForStore } from './config';
import { driverFor } from './drivers';
import { BackendClient } from './client';

/**
 * Local KOT print agent. Subscribes (via polling) to the KOT/Fulfilment service
 * for queued print jobs on this store's station printers, renders each via the
 * device's protocol driver (ESC/POS or ZPL), "prints" it, and ACKs the result.
 *
 * Resilience: a job stays QUEUED on the backend until a PRINTED ack, so a print
 * failure (FAILED ack) or a connectivity drop simply means it's retried on the
 * next poll — a ticket is never silently lost. A local `printed` set dedupes
 * while an ACK is in flight.
 */
const client = new BackendClient();
const devices = devicesForStore(config.storeId);
const protocolOf = new Map<string, PrinterProtocol>(devices.map((d) => [d.id, d.protocol]));
const printed = new Set<string>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function printJob(job: PrintJob): Promise<void> {
  const protocol = protocolOf.get(job.deviceId) ?? 'ESC_POS';
  const driver = driverFor(protocol);
  const bytes = driver.render(job.payload);
  await driver.print(bytes); // real driver writes to USB/serial/network; mock here
  console.log(`\n--- printed ${job.deviceId} [${protocol}] job ${job.id.slice(0, 8)} ---`);
  console.log(bytes.toString());
}

async function pollOnce(): Promise<number> {
  let processed = 0;
  for (const device of devices) {
    let jobs: PrintJob[] = [];
    try {
      jobs = await client.pollJobs(device.id);
    } catch (err) {
      console.error(`poll ${device.id}: ${(err as Error).message}`);
      continue; // backend unreachable — retry next cycle
    }
    for (const job of jobs) {
      if (printed.has(job.id)) continue;
      try {
        await printJob(job);
        await client.ack(job.id, 'PRINTED');
        printed.add(job.id);
        processed++;
      } catch (err) {
        console.error(`job ${job.id.slice(0, 8)} failed: ${(err as Error).message}`);
        await client.ack(job.id, 'FAILED').catch(() => undefined); // stays QUEUED → retried
      }
    }
  }
  return processed;
}

/** Offline showcase (no backend): render one ESC/POS + one ZPL sample sticker. */
async function runSample(): Promise<void> {
  const sample: PrintJob['payload'] = {
    orderId: 'ORDER123456', pickupCode: 'A7Q2', storeId: config.storeId, station: 'BAR',
    itemName: 'Caffè Latte', size: 'Grande', modifiers: ['Oat milk', 'Extra shot'],
    customerNameOrInitial: 'R', fulfilment: 'DINE_IN', tableNumber: '12',
    sequence: { index: 1, total: 2 }, timestamp: new Date().toISOString(), barcode: 'ORDER123456',
  };
  for (const protocol of ['ESC_POS', 'ZPL'] as PrinterProtocol[]) {
    const driver = driverFor(protocol);
    console.log(`\n--- sample [${protocol}] ---`);
    console.log(driver.render(sample).toString());
  }
}

async function main(): Promise<void> {
  if (config.demo) {
    console.log('brew-kot-printer (offline sample)');
    await runSample();
    return;
  }
  console.log(
    `brew-kot-printer → ${config.apiBase} | store ${config.storeId} | devices: ${devices.map((d) => d.id).join(', ')}`,
  );
  if (config.once) {
    console.log(`processed ${await pollOnce()} job(s)`);
    return;
  }
  for (;;) {
    await pollOnce();
    await sleep(config.pollMs);
  }
}

void main();
