# ADR 0001 — Modular monolith now, extraction-ready modules

**Status:** Accepted

## Context
The brief mandates an API-first, event-driven system that can scale like a large
chain, but also wants fast delivery and clean boundaries. Full microservices from
day one adds operational cost (deploys, networking, observability) that slows an
MVP.

## Decision
Launch as a **single NestJS modular monolith**. Each domain (identity, catalog,
ordering, payments, inventory, loyalty, kot, reporting, notifications, privacy) is
a module that owns its schema/namespace and communicates with others **only** via
an internal event bus and published contracts — never by reaching into another
module's tables.

## Consequences
- One deployable, one language (TypeScript), simple local dev.
- Module extraction to its own service later = swap the in-memory bus for
  EventBridge/SNS+SQS and split the deployment; no domain redesign.
- Discipline required: lint/review to prevent cross-module coupling.
