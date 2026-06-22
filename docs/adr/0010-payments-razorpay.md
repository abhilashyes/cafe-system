# ADR 0010 — Payments: Razorpay, idempotency, webhook signatures

**Status:** Accepted

## Context
Razorpay is mandated with native UPI (intent + collect + dynamic QR) plus cards/
wallets/netbanking, and full/partial refunds. Payments are the highest-risk path.

## Decision
Integrate Razorpay behind a `PaymentAdapter` port. **Never store raw card data** —
rely on Razorpay tokenization. **Idempotency-Key required** on payment/order create
to prevent double-charge. **Verify every webhook's HMAC signature** before trusting
it. Support full and partial refunds (manager-approved at POS). Reconcile tenders at
end-of-day; reporting figures must tie back to settlement.

## Consequences
PCI scope minimized; safe retries; trustworthy async capture. Mock adapter in dev
returns deterministic ids and a fake UPI intent so flows run without live keys.
