# Threat Model — Project Brew

Scope: customer mobile app, POS/admin web, KOT print agent, backend, payment and
auth integrations. Methodology: STRIDE over the main data flows.

## Trust boundaries
1. Customer device ↔ API Gateway (public internet)
2. Store network (POS, KDS, print agent) ↔ backend
3. Backend ↔ Cognito / Razorpay (third parties)
4. Backend ↔ data stores / secrets

## STRIDE highlights & mitigations

| Threat | Example | Mitigation |
| --- | --- | --- |
| **Spoofing** | Fake OTP / token replay | Cognito JWT validation at gateway; short-lived tokens; MFA for staff; device binding for POS |
| **Tampering** | Modified order/price client-side | Server-side pricing & validation; never trust client; signed webhooks |
| **Repudiation** | Staff denies a refund | Tamper-evident audit log (who/what/when/where), reviewable by DPO |
| **Information disclosure** | PII leak | TLS 1.2+; KMS at rest; field-level PII encryption; need-to-know access; pseudonymized analytics |
| **Denial of service** | OTP/SMS bombing, order floods | WAF, rate limiting, OTP throttling (Redis), bot protection |
| **Elevation of privilege** | Cashier accessing org reports | Least-privilege RBAC enforced per endpoint + hierarchy scoping |

## Payment-specific
No raw card storage (Razorpay tokenization); idempotency keys; webhook HMAC
verification; reconciliation to settlement.

## Supply chain
SCA (dependency scanning), SAST/DAST in CI, container image scanning, signed builds.

## Abuse cases to test
OTP brute force, replayed webhooks, IDOR on `/orders/{id}` and `/loyalty/accounts/{id}`,
privilege escalation across stores/regions, refund without manager approval.
