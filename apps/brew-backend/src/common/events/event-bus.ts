import { Injectable, Logger } from '@nestjs/common';
import type { DomainEvent, DomainEventName } from '@brew/contracts';

type Handler = (event: DomainEvent) => void | Promise<void>;

/**
 * In-memory event bus (dev). In prod this is backed by EventBridge / SNS+SQS —
 * same publish/subscribe surface so module code is transport-agnostic and
 * extraction-ready. Dedupe by eventId is the consumer's responsibility.
 */
@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<DomainEventName, Handler[]>();

  subscribe(name: DomainEventName, handler: Handler): void {
    const list = this.handlers.get(name) ?? [];
    list.push(handler);
    this.handlers.set(name, list);
  }

  async publish(event: DomainEvent): Promise<void> {
    this.logger.debug(`publish ${event.name} (store=${event.storeId})`);
    for (const handler of this.handlers.get(event.name) ?? []) {
      await handler(event);
    }
  }
}
