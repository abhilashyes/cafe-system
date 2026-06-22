import type { Order } from '../types/ordering';
import type { Product } from '../types/catalog';
import type { Store } from '../types/hierarchy';

/**
 * Stub typed client. In a real build this is generated from the OpenAPI specs
 * (e.g. openapi-typescript + a fetch wrapper). It exists so every app "consumes
 * only published APIs" and never reaches into backend internals.
 *
 * All methods are thin, typed wrappers over `/v1` endpoints. Bodies are stubbed.
 */
export interface BrewClientOptions {
  baseUrl: string;
  /** Cognito access token (JWT). */
  getAccessToken: () => Promise<string | null>;
}

export class BrewClient {
  constructor(private readonly opts: BrewClientOptions) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.opts.getAccessToken();
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Brew API ${method} ${path} -> ${res.status}`);
    return (await res.json()) as T;
  }

  // --- Catalog ---
  listStoreMenu(storeId: string) {
    return this.request<Product[]>('GET', `/v1/stores/${storeId}/menu`);
  }
  listStores() {
    return this.request<Store[]>('GET', `/v1/stores`);
  }

  // --- Ordering ---
  createOrder(input: Partial<Order>) {
    return this.request<Order>('POST', `/v1/orders`, input);
  }
  getOrder(orderId: string) {
    return this.request<Order>('GET', `/v1/orders/${orderId}`);
  }
}
