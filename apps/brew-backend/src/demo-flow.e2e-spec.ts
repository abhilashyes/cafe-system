import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';

/**
 * End-to-end §12 demo flow over the public API:
 * login → order → pay → webhook capture → loyalty accrual → KOT print job →
 * KDS ticket → mark ready → sale in reporting.
 *
 * Uses the mock adapters (AUTH_ADAPTER=mock), so no AWS/Razorpay is contacted.
 */
describe('Demo flow (e2e)', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer test-token' };
  const storeId = 'store_1';
  const customerId = 'cust_e2e';

  beforeAll(async () => {
    process.env.AUTH_ADAPTER = 'mock';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'v' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs order → pay → loyalty → KOT → ready → reporting', async () => {
    const http = request(app.getHttpServer());

    // 1. Customer signs in (mock Cognito OTP).
    await http.post('/v1/auth/otp/start').send({ phone: '+919999999999' }).expect(201);
    const verify = await http
      .post('/v1/auth/otp/verify')
      .send({ phone: '+919999999999', code: '000000' })
      .expect(201);
    expect(verify.body.accessToken).toBeDefined();

    // 2. Place a mobile pre-order: latte (oat + extra shot) + croissant, dine-in T12.
    const orderRes = await http
      .post('/v1/orders')
      .set(auth)
      .set('Idempotency-Key', 'order-key-1')
      .send({
        storeId,
        channel: 'MOBILE_PREORDER',
        fulfilment: 'DINE_IN',
        tableNumber: '12',
        customerId,
        customerName: 'Riya',
        items: [
          { productId: 'prod_latte', quantity: 1, modifierOptionIds: ['opt_oat', 'opt_extra_shot'] },
          { productId: 'prod_croissant', quantity: 1 },
        ],
      })
      .expect(201);

    const order = orderRes.body;
    // Latte 250 + oat 40 + shot 30 = 320; croissant 180 → subtotal 500 (in ₹).
    expect(order.totals.subtotalPaise).toBe(50000);
    // 5% GST split into CGST + SGST.
    expect(order.totals.cgstPaise + order.totals.sgstPaise).toBe(2500);
    expect(order.totals.grandTotalPaise).toBe(52500);
    expect(order.tableNumber).toBe('12');

    // 3. Pay via Razorpay UPI (mock) → get gateway order id.
    const payRes = await http
      .post('/v1/payments')
      .set(auth)
      .set('Idempotency-Key', 'pay-key-1')
      .send({ orderId: order.id, storeId, method: 'UPI_INTENT', amountPaise: order.totals.grandTotalPaise })
      .expect(201);
    const gatewayOrderId = payRes.body.gatewayOrderId;
    expect(gatewayOrderId).toBeDefined();

    // Idempotency: same key returns the same payment.
    const payRetry = await http
      .post('/v1/payments')
      .set(auth)
      .set('Idempotency-Key', 'pay-key-1')
      .send({ orderId: order.id, storeId, method: 'UPI_INTENT', amountPaise: order.totals.grandTotalPaise })
      .expect(201);
    expect(payRetry.body.id).toBe(payRes.body.id);

    // 4. Razorpay webhook captures the payment (signature verified).
    await http
      .post('/v1/payments/webhook')
      .set('X-Razorpay-Signature', 'mock-valid-signature')
      .send({ event: 'payment.captured', gatewayOrderId, gatewayPaymentId: 'pay_mock_1' })
      .expect(201);

    // 5. Loyalty accrued for the customer (driven by PaymentCaptured).
    const loyalty = await http.get(`/v1/loyalty/accounts/${customerId}`).set(auth).expect(200);
    expect(loyalty.body.balanceStars).toBeGreaterThan(0);
    const ledger = await http.get(`/v1/loyalty/accounts/${customerId}/ledger`).set(auth).expect(200);
    expect(ledger.body).toHaveLength(1);
    expect(ledger.body[0].type).toBe('ACCRUAL');

    // 6. KOT print job was enqueued for the bar station; KDS shows the ticket.
    const jobs = await http.get(`/v1/print-jobs?deviceId=${storeId}:BAR`).set(auth).expect(200);
    expect(jobs.body.length).toBeGreaterThan(0);
    const kds = await http.get(`/v1/kds/${storeId}/tickets`).set(auth).expect(200);
    expect(kds.body.length).toBeGreaterThan(0);

    // 7. Bump/ready the order.
    await http.post(`/v1/orders/${order.id}/ready`).set(auth).expect(201);
    const readyOrder = await http.get(`/v1/orders/${order.id}`).set(auth).expect(200);
    expect(readyOrder.body.status).toBe('READY');

    // 8. Sale shows up in reporting with recognised revenue, COGS and profit.
    const report = await http
      .get(`/v1/reports/sales?scopeLevel=STORE&scopeId=${storeId}`)
      .set(auth)
      .expect(200);
    expect(report.body.orders).toBe(1);
    expect(report.body.revenuePaise).toBe(order.totals.grandTotalPaise);
    expect(report.body.byChannel.MOBILE_PREORDER).toBe(1);
    // COGS from BOM: latte 18g×50 + 200ml×6 = 2100; croissant 1×6000 = 6000.
    expect(report.body.cogsPaise).toBe(8100);
    // Profit = net (ex-GST) revenue 50000 − COGS 8100.
    expect(report.body.grossProfitPaise).toBe(41900);

    // 9. Item profitability insights are computed from captured sales.
    const profitability = await http
      .get('/v1/reports/item-profitability')
      .set(auth)
      .expect(200);
    expect(profitability.body.mostProfitable.length).toBeGreaterThan(0);
    expect(profitability.body.mostProfitable[0]).toHaveProperty('marginPercent');
  });

  it('rejects a webhook with a bad signature', async () => {
    await request(app.getHttpServer())
      .post('/v1/payments/webhook')
      .set('X-Razorpay-Signature', 'tampered')
      .send({ event: 'payment.captured', gatewayOrderId: 'whatever' })
      .expect(400);
  });

  it('enforces RBAC: a principal without order:create is forbidden', async () => {
    await request(app.getHttpServer())
      .post('/v1/orders')
      .set(auth)
      .set('x-mock-permissions', 'order:read') // override: missing order:create
      .set('Idempotency-Key', 'order-key-rbac')
      .send({ storeId, channel: 'WALK_IN', fulfilment: 'TAKEAWAY', items: [{ productId: 'prod_latte', quantity: 1 }] })
      .expect(403);
  });

  it('86s a product when its ingredient is exhausted and blocks new orders', async () => {
    const http = request(app.getHttpServer());
    const store = 'store_86';

    // Exhaust croissant stock (opening 200 units) via wastage → out-of-stock event.
    await http
      .post(`/v1/stores/${store}/wastage`)
      .set(auth)
      .send({ ingredientId: 'ing_croissant', quantity: 200, reason: 'spoilage' })
      .expect(201);

    // Menu now shows the croissant as unavailable (86'd) at this store.
    const menu = await http.get(`/v1/stores/${store}/menu`).set(auth).expect(200);
    const croissant = menu.body.find((m: { id: string }) => m.id === 'prod_croissant');
    expect(croissant.available).toBe(false);

    // Ordering the 86'd item is blocked...
    await http
      .post('/v1/orders')
      .set(auth)
      .set('Idempotency-Key', 'order-86')
      .send({ storeId: store, channel: 'WALK_IN', fulfilment: 'TAKEAWAY', items: [{ productId: 'prod_croissant', quantity: 1 }] })
      .expect(409);

    // ...but a product with stock is still orderable.
    await http
      .post('/v1/orders')
      .set(auth)
      .set('Idempotency-Key', 'order-86b')
      .send({ storeId: store, channel: 'WALK_IN', fulfilment: 'TAKEAWAY', items: [{ productId: 'prod_latte', quantity: 1 }] })
      .expect(201);
  });
});
