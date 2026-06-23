# ADR 0004 — Repository split (monorepo + separate Flutter repo)

**Status:** Accepted

## Context
The brief lists 7 logical repos. The team wants single-language sharing across
backend and web (TypeScript) while keeping the mobile app's toolchain (Flutter/
Dart, separate CI, store release cadence) independent.

## Decision
Keep **`brew-backend`, `brew-pos-web`, `brew-admin-global`, `brew-kot-printer`,
`brew-infra`, and `brew-contracts` in one pnpm/Turborepo monorepo** for shared
types and atomic cross-cutting changes. Keep **`brew-mobile-customer` (Flutter) in
its own repo**, integrating purely via the published contracts in `brew-contracts`.

## Consequences
Type-safe sharing and one-PR refactors for the TS side; clean separation for the
mobile release pipeline. Contracts are versioned/published so the Flutter repo
consumes them without a code dependency on the monorepo.
