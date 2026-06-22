# Project Brew — Café Operations Platform

A production-grade, multi-tenant café operations platform for a chain operating
physical stores across India (INR, Asia/Kolkata, GST/DPDP compliant). Built
**API-first** and **event-driven**, launching as a **modular monolith** whose
modules are designed to be extracted into independent services later without
rework.

> **Status: Phase 0 — scaffolding.** This repository contains the full
> structure, shared API contracts, stub modules with mocked adapters, and the
> architecture/security/privacy documentation. Business logic is intentionally
> shallow; depth is added in later phases (see `docs/` and the build brief).

## Repository layout

This is a **pnpm + Turborepo monorepo**. The **Flutter customer app** lives in a
separate repo (`brew-mobile-customer`) and integrates only via the published API
contracts.

| Path | Brief repo | Purpose | Stack |
| --- | --- | --- | --- |
| `packages/brew-contracts` | `brew-contracts` | OpenAPI 3.1 specs, shared types, SDK stub — the API-first backbone | TypeScript |
| `apps/brew-backend` | `brew-backend` | Modular-monolith backend (10 domain modules) | NestJS + TS |
| `apps/brew-pos-web` | `brew-pos-web` | In-store POS + store admin + KDS screen mode | React + TS (Vite) |
| `apps/brew-admin-global` | `brew-admin-global` | Head-office global admin & analytics | React + TS (Vite) |
| `apps/brew-kot-printer` | `brew-kot-printer` | KOT sticker print agent (ESC/POS + ZPL) | Node + TS |
| `apps/brew-infra` | `brew-infra` | Infrastructure as Code (AWS) | Terraform |
| `apps/brew-mobile-customer` ¹ | `brew-mobile-customer` | Customer mobile app | Flutter / Dart |

¹ Intended to live in its **own repository**; nested here for now because the CI
integration could not create the repo. It has no `package.json`, so the pnpm/Turbo
workspace ignores it, and it depends on the platform only via the `/v1` APIs.

## How the pieces talk

```
                         brew-contracts (OpenAPI 3.1 + shared TS types + SDK)
                                          │ consumed by everyone
   ┌───────────────┬────────────────┬────┴────────────┬──────────────────┐
   │               │                │                 │                  │
brew-mobile    brew-pos-web    brew-admin-global   brew-kot-printer   (future svcs)
(Flutter)      (React)         (React)             (print agent)
   │               │                │                 ▲
   └───────────────┴───────► brew-backend ───────────┘  (domain events: print jobs)
                              (NestJS modular monolith)
                                     │
                              brew-infra (AWS: Cognito, Aurora, DynamoDB,
                              SQS/SNS/EventBridge, S3, KMS, API Gateway, WAF)
```

Every capability is exposed as a documented, versioned (`/v1`) API in
`brew-contracts` **before** any UI consumes it. Services communicate via domain
events (`OrderPlaced`, `PaymentCaptured`, `OrderReady`, `InventoryDeducted`,
`LoyaltyAccrued`, …).

## Getting started

```bash
pnpm install        # install workspace deps
pnpm build          # turbo build all packages/apps
pnpm lint           # lint all
pnpm test           # run tests
```

Run a single component:

```bash
pnpm --filter brew-backend start:dev     # backend on :3000, Swagger at /docs
pnpm --filter brew-pos-web dev           # POS web (Vite)
pnpm --filter brew-admin-global dev      # global admin (Vite)
```

## CI/CD

- **`.github/workflows/ci.yml`** — on every PR/push: `pnpm install → lint → test → build`.
- **`.github/workflows/deploy-backend.yml`** — on push to `main` (backend/contracts
  changes) or manual: assumes the AWS deploy role via **GitHub OIDC** (no static
  keys), builds `apps/brew-backend/Dockerfile`, pushes to ECR, registers a new ECS
  task revision, and rolls out the Fargate service.
  - Requires repo secret **`AWS_DEPLOY_ROLE_ARN`** = the `github_deploy_role_arn`
    output from `apps/brew-infra/environments/dev`.

## Documentation

- `docs/architecture/overview.md` — architecture, hierarchy, event catalog, diagram
- `docs/adr/` — Architecture Decision Records (one per DECIDE & DOCUMENT point)
- `docs/security/` — threat model, PII data map, RBAC matrix, DPDP compliance notes

## Non-negotiable constraints (acceptance gates)

- **Channels:** pickup (pre-order + walk-in) and dine-in; channel-extensible.
- **Geo:** India-first, INR, Asia/Kolkata, multi-store/multi-region from day one.
- **Auth:** phone+OTP via AWS Cognito (no customer passwords).
- **Payments:** Razorpay (native UPI intent/collect + cards/wallets/netbanking), refunds.
- **Compliance:** DPDP Act 2023 + GST invoicing (HSN/SAC, GSTIN, CGST/SGST/IGST).
- **Security & Privacy:** first-class modules, enforced server-side.
- **API-first:** OpenAPI 3.1 for every service; UIs consume only published APIs.
