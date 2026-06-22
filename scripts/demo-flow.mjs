#!/usr/bin/env node
// End-to-end §12 demo against a running brew-backend (mock adapters, in-memory).
// Usage: node scripts/demo-flow.mjs   (override base: BREW_API=http://host:3000)
//
// Walks: login → menu → order (dine-in) → UPI pay → webhook capture →
// loyalty accrual → GST invoice → ready → sales report.

const BASE = process.env.BREW_API ?? 'http://localhost:3000';
const customerId = 'cust_demo';
const storeId = 'store_1';
let token = 'dev-token';

const step = (n, msg) => console.log(`\n${n}. ${msg}`);
const ok = (msg) => console.log(`   ✓ ${msg}`);

async function call(method, path, { body, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return data;
}

const key = () => `${Date.now()}-${Math.random()}`;

async function main() {
  step(1, 'Health check');
  ok((await call('GET', '/v1/health')).status);

  step(2, 'Phone + OTP login (mock Cognito, OTP 000000)');
  await call('POST', '/v1/auth/otp/start', { body: { phone: '+919999999999' } });
  const auth = await call('POST', '/v1/auth/otp/verify', { body: { phone: '+919999999999', code: '000000' } });
  token = auth.accessToken ?? token;
  ok('signed in');

  step(3, 'Browse store menu');
  const menu = await call('GET', `/v1/stores/${storeId}/menu`);
  ok(`${menu.length} items: ${menu.map((m) => m.name).join(', ')}`);

  step(4, 'Place a dine-in pre-order (latte + croissant, table 7)');
  const order = await call('POST', '/v1/orders', {
    headers: { 'idempotency-key': key() },
    body: {
      storeId, channel: 'MOBILE_PREORDER', fulfilment: 'DINE_IN', tableNumber: '7',
      customerId, customerName: 'Demo',
      items: [{ productId: 'prod_latte', quantity: 1 }, { productId: 'prod_croissant', quantity: 1 }],
    },
  });
  ok(`order ${order.pickupCode}  total ₹${(order.totals.grandTotalPaise / 100).toFixed(2)} (GST ₹${((order.totals.cgstPaise + order.totals.sgstPaise) / 100).toFixed(2)})`);

  step(5, 'Pay via Razorpay UPI (mock)');
  const payment = await call('POST', '/v1/payments', {
    headers: { 'idempotency-key': key() },
    body: { orderId: order.id, storeId, method: 'UPI_INTENT', amountPaise: order.totals.grandTotalPaise },
  });
  ok(`gateway order ${payment.gatewayOrderId}`);

  step(6, 'Razorpay webhook captures the payment (signature verified)');
  await call('POST', '/v1/payments/webhook', {
    headers: { 'x-razorpay-signature': 'mock-valid-signature' },
    body: { event: 'payment.captured', gatewayOrderId: payment.gatewayOrderId, gatewayPaymentId: 'pay_demo' },
  });
  ok('captured → emits PaymentCaptured (inventory deducted, loyalty accrues, reporting)');

  step(7, 'Loyalty accrued for the customer');
  const loyalty = await call('GET', `/v1/loyalty/accounts/${customerId}`);
  ok(`${loyalty.balanceStars} stars, tier ${loyalty.tierId}`);

  step(8, 'GST tax invoice');
  const inv = await call('GET', `/v1/orders/${order.id}/invoice`);
  ok(`${inv.invoiceNumber}  GSTIN ${inv.sellerGstin}  CGST ₹${(inv.cgstPaise / 100).toFixed(2)} + SGST ₹${(inv.sgstPaise / 100).toFixed(2)}`);

  step(9, 'Mark order ready (KDS bump equivalent)');
  const ready = await call('POST', `/v1/orders/${order.id}/ready`);
  ok(`status ${ready.status}`);

  step(10, 'Sales report (revenue recognised on capture, profit from BOM)');
  const report = await call('GET', `/v1/reports/sales?scopeLevel=STORE&scopeId=${storeId}`);
  ok(`orders ${report.orders}, revenue ₹${(report.revenuePaise / 100).toFixed(2)}, COGS ₹${(report.cogsPaise / 100).toFixed(2)}, profit ₹${(report.grossProfitPaise / 100).toFixed(2)}`);

  console.log('\n✅ Demo flow complete.');
}

main().catch((e) => {
  console.error('\n❌ Demo failed:', e.message);
  process.exit(1);
});
