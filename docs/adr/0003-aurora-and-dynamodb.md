# ADR 0003 — Aurora PostgreSQL primary + DynamoDB for cart/session

**Status:** Accepted

## Context
Most domain data is relational (orders, recipes, ledgers, reporting joins) and
benefits from transactions and ad-hoc queries. A few access patterns are
high-write, key-value, latency-sensitive (live carts, sessions, rate-limit
counters).

## Decision
**Aurora PostgreSQL** is the primary transactional store for all domain modules.
**DynamoDB** is used only where key-value patterns dominate — cart and session —
and **Redis** for ephemeral counters/caching. The loyalty points ledger lives in
Postgres so it can be audited and reconciled to transactions.

## Consequences
Strong consistency and reporting where it matters; scalable hot paths for cart/
session. Two data technologies to operate; boundaries kept per-module.
