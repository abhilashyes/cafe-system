# ADR 0007 — Monorepo tooling (pnpm + Turborepo)

**Status:** Accepted

## Context
The TS components share `@brew/contracts` and benefit from coordinated builds and
caching.

## Decision
Use **pnpm workspaces** for dependency management (strict, fast, content-addressed
store) and **Turborepo** for task orchestration/caching (`build`, `lint`, `test`,
`dev`) with `^build` dependencies so contracts build before consumers.

## Consequences
Fast incremental builds and a single `pnpm build`/`pnpm test` at the root.
Alternative (Nx) considered; Turborepo chosen for lower config overhead.
