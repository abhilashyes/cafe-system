# Architecture Decision Records

One ADR per **DECIDE & DOCUMENT** point in the build brief. Format: Context →
Decision → Consequences. Status: Accepted (Phase 0) unless noted.

| ADR | Title |
| --- | --- |
| 0001 | Modular monolith now, extraction-ready modules |
| 0002 | AWS-native building blocks |
| 0003 | Aurora PostgreSQL primary + DynamoDB for cart/session |
| 0004 | Repository split (monorepo + separate Flutter repo) |
| 0005 | Tenancy & hierarchy model (Org→Region→Store→Station) |
| 0006 | Event bus (EventBridge/SNS+SQS; in-memory in dev) |
| 0007 | Monorepo tooling (pnpm + Turborepo) |
| 0008 | IaC with Terraform |
| 0009 | Auth & token strategy (Cognito phone+OTP, MFA for staff) |
| 0010 | Payments: Razorpay tokenization, idempotency, webhook signatures |
| 0011 | Data retention & erasure (DPDP) |
