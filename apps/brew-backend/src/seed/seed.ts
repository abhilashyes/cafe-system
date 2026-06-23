/**
 * Demo seed + flow walkthrough (§12 of the brief).
 *
 * This is a PLACEHOLDER that documents the end-to-end demo path. In a full build
 * it seeds the DB (org → region → store → menu/recipe) and then drives the flow
 * via the public API. Run with: `pnpm --filter brew-backend seed`.
 */

const steps = [
  'Create org → region → store → stations (Bar/Hot Kitchen/Cold/Bakery)',
  'Create products + recipes (BOM) + GST/HSN; set store availability',
  'Customer phone+OTP login (mock Cognito): OTP 000000',
  'Place a MOBILE_PREORDER (TAKEAWAY) → OrderPlaced',
  '  → Inventory deducts ingredients (InventoryDeducted)',
  '  → KOT enqueues station print jobs (KotPrintRequested)',
  'Pay via Razorpay UPI (mock) → webhook → PaymentCaptured',
  '  → Loyalty accrues stars + recomputes tier (LoyaltyAccrued)',
  'Bump on KDS → OrderReady → customer notified',
  'Sale appears in reporting with profit / unit-economics computed',
];

console.log('Project Brew — demo flow (scaffold placeholder)\n');
steps.forEach((s, i) => console.log(`${String(i + 1).padStart(2, ' ')}. ${s}`));
console.log('\nWire real persistence + API calls here in Phase 1.');
