import { Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { DomainEvents } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { KotService } from './kot.service';

/**
 * Live KDS over WebSocket. Each display connects with `?storeId=...` and joins
 * that store's room. On any KdsUpdated event the server pushes the store's current
 * tickets, so bumps/new orders appear in real time. Clients reconnect and get a
 * fresh snapshot, reconciling any missed events.
 */
@WebSocketGateway({ namespace: '/kds', cors: { origin: '*' } })
export class KdsGateway implements OnGatewayConnection, OnModuleInit {
  private readonly logger = new Logger(KdsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly events: EventBus,
    private readonly kot: KotService,
  ) {}

  onModuleInit(): void {
    this.events.subscribe(DomainEvents.KdsUpdated, (evt) => {
      this.server?.to(evt.storeId).emit('kds:tickets', this.kot.kdsTickets(evt.storeId));
    });
  }

  handleConnection(client: Socket): void {
    const storeId = client.handshake.query.storeId;
    if (typeof storeId !== 'string') {
      client.disconnect(true);
      return;
    }
    client.join(storeId);
    this.logger.debug(`KDS connected to store ${storeId}`);
    // Send an immediate snapshot so the display populates on connect.
    client.emit('kds:tickets', this.kot.kdsTickets(storeId));
  }
}
