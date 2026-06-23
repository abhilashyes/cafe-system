import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';

/**
 * e2e coverage for the added features: GST invoice, loyalty redemption,
 * procurement (PO → approve → receive → stock), and privacy export/erasure.
 */
describe('Added features (e2e)', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer test-token' };

  beforeAll(async () => {
    process.env.AUTH_ADAPTER = 'mock';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'v' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  const http = () => request(app.getHttpServer());

  // Helper: place an order and pay cash (captures → loyalty accrues).
  async function orderAndPayCash(storeId: string, customerId: string, latteQty: number) {
    const order = (
      await http()
        .post('/v1/orders')
        .set(auth)
        .set('Idempotency-Key', `o-${storeId}-${customerId}-${Date.now()}-${Math.random()}`)
        .send({
          storeId,
          channel: 'WALK_IN',
          fulfilment: 'TAKEAWAY',
          customerId,
          items: [{ productId: 'prod_latte', quantity: latteQty }],
        })
        .expect(201)
    ).body;
    await http()
      .post('/v1/payments')
      .set(auth)
      .set('Idempotency-Key', `p-${order.id}`)
      .send({ orderId: order.id, storeId, method: 'CASH', amountPaise: order.totals.grandTotalPaise })
      .expect(201);
    return order;
  }

  it('generates a GST-compliant invoice for an order', async () => {
    const order = await orderAndPayCash('store_inv', 'cust_inv', 1);
    const inv = (await http().get(`/v1/orders/${order.id}/invoice`).set(auth).expect(200)).body;

    expect(inv.sellerGstin).toMatch(/^[0-9]{2}[A-Z0-9]+$/);
    expect(inv.currency).toBe('INR');
    expect(inv.lines[0].hsnSac).toBe('2106'); // latte HSN
    // 5% GST on ₹250 = ₹12.50, split evenly into CGST + SGST.
    expect(inv.cgstPaise + inv.sgstPaise).toBe(1250);
    expect(inv.cgstPaise).toBe(625);
    expect(inv.grandTotalPaise).toBe(order.totals.grandTotalPaise);
  });

  it('accrues stars then redeems a reward (and rejects when insufficient)', async () => {
    // 6 lattes (₹1500 + GST) → ~157 stars on capture.
    await orderAndPayCash('store_rw', 'cust_rw', 6);
    const acct = (await http().get('/v1/loyalty/accounts/cust_rw').set(auth).expect(200)).body;
    expect(acct.balanceStars).toBeGreaterThanOrEqual(150);

    const redeem = (
      await http().post('/v1/loyalty/redeem').set(auth).send({ customerId: 'cust_rw', rewardId: 'rw_free_coffee' }).expect(201)
    ).body;
    expect(redeem.discountPaise).toBe(15000);

    const ledger = (await http().get('/v1/loyalty/accounts/cust_rw/ledger').set(auth).expect(200)).body;
    expect(ledger.some((e: { type: string }) => e.type === 'REDEMPTION')).toBe(true);

    // Not enough stars left for another redemption → 402.
    await http().post('/v1/loyalty/redeem').set(auth).send({ customerId: 'cust_rw', rewardId: 'rw_free_coffee' }).expect(402);
  });

  it('applies a reward discount at checkout', async () => {
    await orderAndPayCash('store_rwc', 'cust_rwc', 8); // ~210 stars
    const order = (
      await http()
        .post('/v1/orders')
        .set(auth)
        .set('Idempotency-Key', `rwc-${Date.now()}`)
        .send({
          storeId: 'store_rwc',
          channel: 'MOBILE_PREORDER',
          fulfilment: 'TAKEAWAY',
          customerId: 'cust_rwc',
          rewardId: 'rw_free_coffee',
          items: [{ productId: 'prod_latte', quantity: 1 }],
        })
        .expect(201)
    ).body;
    expect(order.totals.discountPaise).toBe(15000);
    // grand = (250 + 5% GST) − 15000 paise discount.
    expect(order.totals.grandTotalPaise).toBe(26250 - 15000);
  });

  it('runs procurement: PO → approve → receive increments stock', async () => {
    const store = 'store_proc';
    const before = (await http().get(`/v1/stores/${store}/inventory`).set(auth).expect(200)).body;
    const beforeEspresso = before.find((l: { ingredientId: string }) => l.ingredientId === 'ing_espresso').onHand;

    const po = (
      await http()
        .post('/v1/purchase-orders')
        .set(auth)
        .send({ supplierId: 'sup_beans', storeId: store, lines: [{ ingredientId: 'ing_espresso', quantity: 1000 }] })
        .expect(201)
    ).body;
    expect(po.status).toBe('DRAFT');

    await http().post(`/v1/purchase-orders/${po.id}/approve`).set(auth).expect(201);
    const received = (await http().post(`/v1/purchase-orders/${po.id}/receive`).set(auth).send({}).expect(201)).body;
    expect(received.status).toBe('RECEIVED');

    const after = (await http().get(`/v1/stores/${store}/inventory`).set(auth).expect(200)).body;
    const afterEspresso = after.find((l: { ingredientId: string }) => l.ingredientId === 'ing_espresso').onHand;
    expect(afterEspresso).toBe(beforeEspresso + 1000);
  });

  it('exports a customer’s data and erases (anonymizes) it on request', async () => {
    await orderAndPayCash('store_dpdp', 'cust_dpdp', 1);
    await http().post('/v1/privacy/consents').set(auth).send({ purpose: 'MARKETING', granted: true }).expect(201);

    const exported = (await http().get('/v1/privacy/export?customerId=cust_dpdp').set(auth).expect(200)).body;
    expect(exported.orders.length).toBeGreaterThanOrEqual(1);
    expect(exported.loyalty.account.customerId).toBe('cust_dpdp');

    const erased = (await http().post('/v1/privacy/erase').set(auth).send({ customerId: 'cust_dpdp' }).expect(201)).body;
    expect(erased.ordersAnonymized).toBeGreaterThanOrEqual(1);

    // After erasure the orders are no longer linked to the customer.
    const after = (await http().get('/v1/privacy/export?customerId=cust_dpdp').set(auth).expect(200)).body;
    expect(after.orders.length).toBe(0);

    // Retention policies are published.
    const policies = (await http().get('/v1/privacy/retention').set(auth).expect(200)).body;
    expect(policies.some((p: { dataCategory: string }) => p.dataCategory === 'order')).toBe(true);
  });
});
