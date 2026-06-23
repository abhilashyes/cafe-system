# ADR 0006 — Domain event bus

**Status:** Accepted

## Context
Modules must stay decoupled and extraction-ready. They need to react to each
other's facts (order placed → deduct stock, print, accrue loyalty) without
synchronous call chains.

## Decision
Define a typed **domain event catalog** in `brew-contracts` (`DomainEvents`).
Publish/subscribe through an `EventBus` abstraction. In dev it is **in-memory**;
in prod it is backed by **EventBridge / SNS+SQS** behind the same interface.
Events carry `eventId` (dedupe) and `storeId` (routing/filtering).

## Consequences
Module code is transport-agnostic. Consumers must be idempotent. Swapping the
prod transport is a provider change, not a code change in modules.
