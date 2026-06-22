# ADR 0005 — Tenancy & hierarchy model

**Status:** Accepted

## Context
Multi-store, multi-region from launch. Data must isolate per store while reporting
and configuration roll up the chain. RBAC scopes follow the same shape.

## Decision
Model **Organization → Region → Store → Station**. Every transactional row carries
a `storeId`; queries are store-scoped by default. Region and Org are derived for
roll-ups. Role assignments bind to a hierarchy node (`ORG`/`REGION`/`STORE`), so a
Store Manager sees one store and a Regional Manager sees a region. GSTIN and
place-of-supply are per store.

## Consequences
Uniform scoping for authorization, reporting, and config overrides. Station type
(Bar/Hot Kitchen/Cold/Bakery) drives KOT routing.
