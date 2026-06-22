# ADR 0002 — AWS-native building blocks

**Status:** Accepted

## Context
Cognito is mandated, so the stack is AWS-native. We need a documented mapping of
concerns to services.

## Decision
API Gateway + WAF + CloudFront at the edge; ECS Fargate for the backend; Aurora
PostgreSQL as the primary transactional store; DynamoDB for key-value access
(cart/session); ElastiCache/Redis for caching and rate-limit counters; EventBridge
/ SNS+SQS for async events; S3 for assets/receipts; Secrets Manager + KMS for
secrets and field-level PII encryption; CloudWatch + OpenTelemetry + CloudTrail for
observability. Region **ap-south-1 (Mumbai)** for India data residency.

## Consequences
Vendor alignment with the Cognito mandate; clear IaC targets (see `brew-infra`).
Lock-in mitigated by keeping domain logic cloud-agnostic behind adapters.
