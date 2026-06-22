# PII Data Map — Project Brew

Central PII catalog. Raw PII is restricted to need-to-know services; analytics use
pseudonymized copies. Region: ap-south-1 (India data residency).

| Data element | Category | Owning module | Purpose | Encryption | Retention |
| --- | --- | --- | --- | --- | --- |
| Phone number | PII (identifier) | Identity | Auth (transactional) | Field-level (KMS) | Until account deletion; pseudonymize on erasure |
| Customer name | PII | Identity | Order labeling, receipts | Field-level | As above |
| Device/push token | PII (device) | Notifications | Order-status push | At rest | Until unregister / 18 mo idle |
| Cognito `sub` | Pseudonymous id | Identity | Principal linkage | At rest | Account lifetime |
| Order history | PII (behavioral) | Ordering | Fulfilment, support | At rest | Statutory (financial) then purge |
| Payment token | Tokenized (no PAN) | Payments | Repeat payment | Razorpay vault | Per Razorpay |
| Loyalty ledger | PII (behavioral) | Loyalty | Rewards/tiers | At rest | Account lifetime; anonymize on erasure |
| Consent records | Compliance | Privacy | DPDP proof | At rest | 7 years (evidentiary) |
| Audit logs | Security | Common | Accountability | At rest, tamper-evident | Per policy |
| GST invoices | Financial | Reporting/Payments | Tax compliance | At rest | Statutory (≈8 yrs) |

## Flows
- **Marketing** uses only data with active `MARKETING` consent.
- **Analytics** consumes a pseudonymized projection (no raw phone/name).
- **Erasure** deletes operational PII and anonymizes retained financial rows
  (see ADR 0011).
