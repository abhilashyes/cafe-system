# ADR 0012 — GCP as an alternative deployment target + Identity Platform auth

**Status:** Accepted (alternative to ADR 0002/0009 for cost-lean / GCP-hosted
deployments; AWS remains a supported target)

## Context
The pilot needs a cheaper, lower-ops hosting option than AWS, while preserving
DPDP data residency (India region) and not rewriting the application. The platform
is already portable: a Docker container + PostgreSQL/Redis/object-store/event-bus,
with auth/payments/events behind ports (`AuthAdapter`, `PaymentAdapter`,
`EventBus`) selected at the composition root by `BREW_PROFILE`. This makes a second
cloud target an additive change (a `live` adapter set + an IaC stack), not a
redesign.

## Decision
Add **Google Cloud (asia-south1, Mumbai)** as a first-class deployment option
alongside AWS:

- **Compute:** Cloud Run (scale-to-zero) for `brew-backend`; Artifact Registry for
  images; Cloud Build / GitHub Actions via **Workload Identity Federation**
  (keyless).
- **Data plane (live profile):** Cloud SQL for PostgreSQL, Memorystore for Redis,
  Firestore for cart/session, Cloud Storage for objects, Pub/Sub (+ DLQ) for
  domain events, Secret Manager for secrets.
- **Authentication:** **Identity Platform** (productized Firebase Auth) is the
  GCP equivalent of Cognito — customers sign in with **phone number + SMS OTP**;
  staff use email/password + **MFA**. The backend verifies Identity Platform **ID
  tokens (JWTs)** via Google's public JWKS (or the Firebase Admin SDK), so a
  `LiveAuthAdapter` (Identity Platform) drops in behind the existing `AuthAdapter`
  port with no change to domain code. OTP throttling uses Memorystore, mirroring
  the Redis-based throttle on AWS.

IaC lives in `apps/brew-infra-gcp` (parallel to the AWS `apps/brew-infra`). The
demo profile needs none of the data/auth plane, so a `brew_profile = "demo"` apply
stands up a working public demo with no database or secrets.

## Consequences
- Two supported targets; choose per environment/cost. Lower pilot cost and ops on
  GCP (scale-to-zero, fewer managed primitives needed than ECS).
- Auth is provider-pluggable: Cognito (ADR 0009) **or** Identity Platform behind
  the same `AuthAdapter`; the phone-OTP customer UX and staff-MFA policy are
  identical either way.
- Slight duplication of IaC; mitigated by keeping the application cloud-agnostic
  and documenting the AWS↔GCP service mapping in `brew-infra-gcp/README.md`.
- For production on GCP add Cloud Armor (WAF), Cloud SQL REGIONAL HA, Redis
  STANDARD_HA, and Cloud Logging/Monitoring/Trace — the upgrade path mirrors the
  AWS pilot→prod notes.
