# ADR 0011 — Data retention & erasure (DPDP)

**Status:** Accepted

## Context
The DPDP Act 2023 grants erasure/correction/portability rights, while Indian tax
law requires retaining financial records. These must coexist.

## Decision
Per-category **retention policies** (see `RetentionPolicy`): operational PII is
deleted/anonymized after its purpose ends; **transactional/financial records are
retained for the statutory period, then purged**. Erasure requests
**anonymize** the customer on retained financial rows (pseudonymize the identity,
keep the amounts) rather than deleting tax data. Consent is captured per purpose in
a versioned, timestamped ledger; withdrawal is one tap. DSRs are SLA-tracked and
overseen by the Privacy Officer.

## Consequences
Right-to-be-forgotten honored without breaking GST/audit obligations. Analytics use
pseudonymized data; raw PII is need-to-know.
