import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DomainEvents,
  type KdsTicket,
  type KdsTicketItem,
  type PrintJob,
  type StationType,
} from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { CatalogService } from '../catalog/catalog.service';
import { OrderingService } from '../ordering/ordering.service';

/**
 * KOT/Fulfilment — on OrderPlaced it builds a live KDS ticket (items resolved via
 * Catalog for name + station) and one print job per item routed to its station's
 * device. Bumping an item updates the ticket; when all items are ready it marks the
 * order ready (single source of truth = Ordering). Every change publishes
 * KdsUpdated so the WebSocket gateway can push to displays.
 */
@Injectable()
export class KotService implements OnModuleInit {
  private readonly jobs: PrintJob[] = [];
  private readonly tickets = new Map<string, KdsTicket>(); // orderId -> ticket

  constructor(
    private readonly events: EventBus,
    private readonly catalog: CatalogService,
    private readonly ordering: OrderingService,
  ) {}

  onModuleInit(): void {
    this.events.subscribe(DomainEvents.OrderPlaced, async (evt) => {
      const data = evt.data as {
        orderId: string;
        items: Array<{ productId: string; quantity: number }>;
      };
      await this.onOrder(evt.storeId, data.orderId, data.items);
    });
  }

  private async onOrder(
    storeId: string,
    orderId: string,
    lines: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const order = this.ordering.get(orderId);
    const items: KdsTicketItem[] = lines.map((line) => {
      const product = this.catalog.getProduct(line.productId);
      const station: StationType = product?.station ?? 'BAR';
      const itemId = randomUUID();
      // One print job (sticker) per unit, routed to the station's device.
      for (let i = 0; i < line.quantity; i++) {
        this.jobs.push(this.buildJob(storeId, orderId, product?.name ?? line.productId, station, order));
      }
      return {
        itemId,
        productId: line.productId,
        name: product?.name ?? line.productId,
        quantity: line.quantity,
        station,
        modifiers: [],
        status: 'PENDING',
      };
    });

    const ticket: KdsTicket = {
      orderId,
      storeId,
      pickupCode: order?.pickupCode ?? orderId.slice(0, 4).toUpperCase(),
      fulfilment: order?.fulfilment ?? 'TAKEAWAY',
      tableNumber: order?.tableNumber,
      customerName: order?.customerName,
      createdAt: new Date().toISOString(),
      items,
    };
    this.tickets.set(orderId, ticket);

    await this.events.publish({
      name: DomainEvents.KotPrintRequested,
      storeId,
      occurredAt: ticket.createdAt,
      eventId: randomUUID(),
      data: { orderId, jobCount: items.reduce((n, i) => n + i.quantity, 0) },
    });
    await this.emitKdsUpdated(storeId);
  }

  private buildJob(
    storeId: string,
    orderId: string,
    itemName: string,
    station: StationType,
    order: ReturnType<OrderingService['get']>,
  ): PrintJob {
    return {
      id: randomUUID(),
      deviceId: `${storeId}:${station}`,
      status: 'QUEUED',
      attempts: 0,
      createdAt: new Date().toISOString(),
      payload: {
        orderId,
        pickupCode: order?.pickupCode ?? orderId.slice(0, 4).toUpperCase(),
        storeId,
        station,
        itemName,
        modifiers: [],
        fulfilment: order?.fulfilment ?? 'TAKEAWAY',
        tableNumber: order?.tableNumber,
        customerNameOrInitial: order?.customerName?.[0],
        sequence: { index: 1, total: 1 },
        timestamp: new Date().toISOString(),
      },
    };
  }

  pollJobs(deviceId: string): PrintJob[] {
    return this.jobs.filter((j) => j.deviceId === deviceId && j.status === 'QUEUED');
  }

  ackJob(jobId: string, status: 'PRINTED' | 'FAILED'): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return;
    job.attempts += 1;
    job.status = status === 'PRINTED' ? 'PRINTED' : 'QUEUED'; // failed → stays queued
  }

  kdsTickets(storeId: string, station?: string): KdsTicket[] {
    return [...this.tickets.values()]
      .filter((t) => t.storeId === storeId)
      .map((t) =>
        station ? { ...t, items: t.items.filter((i) => i.station === station) } : t,
      )
      .filter((t) => t.items.length > 0);
  }

  /** Bump one item ready; when the whole order is ready, mark the order ready. */
  async bumpItem(itemId: string): Promise<KdsTicket | undefined> {
    for (const ticket of this.tickets.values()) {
      const item = ticket.items.find((i) => i.itemId === itemId);
      if (!item) continue;
      item.status = 'READY';
      if (ticket.items.every((i) => i.status === 'READY')) {
        await this.ordering.markReady(ticket.orderId); // emits OrderReady → app/pickup board
      }
      await this.emitKdsUpdated(ticket.storeId);
      return ticket;
    }
    return undefined;
  }

  private async emitKdsUpdated(storeId: string): Promise<void> {
    await this.events.publish({
      name: DomainEvents.KdsUpdated,
      storeId,
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { storeId },
    });
  }
}
