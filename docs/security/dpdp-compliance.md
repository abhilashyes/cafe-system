# DPDP Act 2023 — Compliance Notes

How Project Brew meets India's Digital Personal Data Protection Act, 2023. The
Privacy module is first-class (not scattered logic).

| DPDP obligation | Implementation |
| --- | --- |
| **Notice** | Privacy notice surfaced at sign-up and in the in-app Privacy Center; versioned (`noticeVersion`). |
| **Consent (per purpose)** | `ConsentRecord` ledger captures purpose (Transactional/Marketing/Analytics), grant/withdraw, version, timestamp. One-tap withdrawal. |
| **Purpose limitation & minimization** | Data tagged by purpose in the PII map; collect only what's needed; analytics use pseudonymized data. |
| **Data Principal rights** | DSR flows for Access, Correction, **Erasure**, Portability — SLA-tracked (`DataSubjectRequest`, 30-day default). In-app + admin. |
| **Retention** | Per-category `RetentionPolicy`; automated delete/anonymize jobs; financial data kept per tax law then purged (ADR 0011). |
| **Right to be forgotten** | Erasure deletes operational PII; anonymizes retained financial rows to satisfy GST/audit. |
| **Roles** | Privacy Officer (DPO) role with oversight, DSR handling, and audit-log access. |
| **Breach process** | Detection → assessment → notification workflow aligned to DPDP timelines; incident runbook. |
| **Data residency** | Processing in ap-south-1 (Mumbai). |
| **Security safeguards** | TLS 1.2+, KMS at rest, field-level PII encryption, RBAC, tamper-evident audit (see threat model). |

## Where it lives
- Backend: `modules/privacy` (consent ledger, DSRs, consent-gated notifications).
- Contracts: `types/privacy.ts`, `openapi/privacy.openapi.yaml`.
- Admin: Privacy Admin screen (`brew-admin-global`). Customer: Privacy Center
  (`brew-mobile-customer`).
