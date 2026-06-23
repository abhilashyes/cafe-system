# ADR 0008 — IaC with Terraform

**Status:** Accepted

## Context
The brief allows Terraform or AWS CDK. We want broad team familiarity, a large
provider/module ecosystem, and a declarative plan/apply workflow.

## Decision
Use **Terraform** with a `modules/` + `environments/{dev,staging,prod}` layout and
remote state (S3 + DynamoDB lock). Secrets never live in state-committed files;
they come from Secrets Manager/Parameter Store.

## Consequences
Declarative, reviewable infra; per-environment composition. CDK's TypeScript
affinity was a draw but Terraform's ecosystem and ops familiarity won.
