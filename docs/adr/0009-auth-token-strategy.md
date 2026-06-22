# ADR 0009 — Auth & token strategy

**Status:** Accepted

## Context
Customers must sign in by phone+OTP (no passwords); staff/admin need stronger
controls. Cognito is mandated.

## Decision
**AWS Cognito** is the identity provider. Customers: phone-number SMS OTP as the
primary factor. Staff/admin roles: **MFA required**, plus **device binding** for
POS terminals. Tokens: short-lived access JWTs + rotating refresh tokens (stored in
Keychain/Keystore on mobile). The API Gateway validates the JWT (signature, iss/aud/
exp); services still enforce RBAC server-side. OTP endpoints are throttled (Redis)
to prevent SMS-bombing.

## Consequences
Single place for JWT validation; least-privilege enforced per endpoint. Mock
adapter in dev (OTP `000000`) keeps the system runnable without Cognito.
