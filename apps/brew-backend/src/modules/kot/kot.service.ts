import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type PrintJob } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

/** KOT/Fulfilment — builds sticker payloads, routes to station printers, KDS state. */
@Injectable()
export class KotService implements OnModuleInit {
  private readonly jobs: PrintJob[] = [];

  constructor(private readonly events: EventBus) {}

  onModuleInit(): void {
    // On a new order, generate one print job per item routed to its station.
    this.events.subscribe(DomainEvents.OrderPlaced, async (evt) => {
      await this.enqueueForOrder(evt.storeId, (evt.data as { orderId: string }).orderId);
    });
  }

  private async enqueueForOrder(storeId: string, orderId: string): Promise<void> {
    // MOCK: one job; a full build expands order items → station → device mapping.
    const job: PrintJob = {
      id: randomUUID(),
      deviceId: `${storeId}:BAR`,
      status: 'QUEUED',
      attempts: 0,
      createdAt: new Date().toISOString(),
      payload: {
        orderId,
        pickupCode: orderId.slice(0, 4).toUpperCase(),
        storeId,
        station: 'BAR',
        itemName: 'Caffè Latte',
        modifiers: [],
        fulfilment: 'TAKEAWAY',
        sequence: { index: 1, total: 1 },
        timestamp: new Date().toISOString(),
      },
    };
    this.jobs.push(job);
    await this.events.publish({
      name: DomainEvents.KotPrintRequested,
      storeId,
      occurredAt: job.createdAt,
      eventId: randomUUID(),
      data: { jobId: job.id, deviceId: job.deviceId },
    });
  }

  pollJobs(deviceId: string): PrintJob[] {
    return this.jobs.filter((j) => j.deviceId === deviceId && j.status === 'QUEUED');
  }

  ackJob(jobId: string, status: 'PRINTED' | 'FAILED'): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return;
    job.attempts += 1;
    job.status = status === 'PRINTED' ? 'PRINTED' : 'QUEUED'; // failed → stays queued for retry
  }

  kdsTickets(storeId: string, station?: string): PrintJob[] {
    return this.jobs.filter(
      (j) => j.payload.storeId === storeId && (!station || j.payload.station === station),
    );
  }
}
