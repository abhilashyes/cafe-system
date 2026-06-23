import type { CreateOrderInput, Order } from '../types/ordering';
import type { MenuItem } from '../types/catalog';
import type { Store } from '../types/hierarchy';
import type { Payment, PaymentMethod } from '../types/payments';
import type { KdsTicket } from '../types/kot';

/**
 * Stub typed client. In a real build this is generated from the OpenAPI specs
 * (e.g. openapi-typescript + a fetch wrapper). It exists so every app "consumes
 * only published APIs" and never reaches into backend internals.
 */
export interface BrewClientOptions {
  baseUrl: string;
  /** Cognito access token (JWT). */
  getAccessToken: () => Promise<string | null>;
}

export interface CreatePaymentInput {
  orderId: string;
  storeId: string;
  method: PaymentMethod;
  amountPaise: number;
}

export class BrewClient {
  constructor(private readonly opts: BrewClientOptions) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const token = await this.opts.getAccessToken();
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Brew API ${method} ${path} -> ${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  private idempotencyKey(): string {
    return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  }

  // --- Catalog ---
  listStoreMenu(storeId: string) {
    return this.request<MenuItem[]>('GET', `/v1/stores/${storeId}/menu`);
  }
  listStores() {
    return this.request<Store[]>('GET', `/v1/stores`);
  }

  // --- Ordering ---
  createOrder(input: CreateOrderInput) {
    return this.request<Order>('POST', `/v1/orders`, input, {
      'idempotency-key': this.idempotencyKey(),
    });
  }
  getOrder(orderId: string) {
    return this.request<Order>('GET', `/v1/orders/${orderId}`);
  }
  markOrderReady(orderId: string) {
    return this.request<Order>('POST', `/v1/orders/${orderId}/ready`);
  }

  // --- Payments ---
  createPayment(input: CreatePaymentInput) {
    return this.request<Payment>('POST', `/v1/payments`, input, {
      'idempotency-key': this.idempotencyKey(),
    });
  }

  // --- KDS / Fulfilment ---
  getKdsTickets(storeId: string, station?: string) {
    const q = station ? `?station=${encodeURIComponent(station)}` : '';
    return this.request<KdsTicket[]>('GET', `/v1/kds/${storeId}/tickets${q}`);
  }
  bumpItem(itemId: string) {
    return this.request<void>('POST', `/v1/kds/items/${itemId}/bump`);
  }
}
