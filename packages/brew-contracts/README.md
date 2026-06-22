# @brew/contracts

The **API-first backbone** of Project Brew. Everything else consumes this
package; nothing reaches into backend internals.

## What's here

- `openapi/*.openapi.yaml` — **OpenAPI 3.1** spec per service domain
  (identity, catalog, ordering, payments, loyalty, kot-fulfilment, inventory,
  reporting, notifications, privacy). All paths are versioned under `/v1`.
- `src/types/` — shared TypeScript types for the domain model and the domain-event
  catalog (`DomainEvents`).
- `src/sdk/` — a stub typed client (`BrewClient`). In a full build this is
  **generated** from the OpenAPI specs (e.g. `openapi-typescript`).

## API-first workflow

1. Change/author the OpenAPI spec **first**.
2. Lint it (`pnpm openapi:lint` — wire spectral/redocly in CI).
3. Regenerate types/SDK.
4. Implement the backend against the spec (contract tests).
5. Only then consume it from POS / admin / mobile.

Backward-compatible changes only within a major version; breaking changes bump
the API major (`/v2`).

## Build

```bash
pnpm --filter @brew/contracts build   # tsc -> dist/
```
