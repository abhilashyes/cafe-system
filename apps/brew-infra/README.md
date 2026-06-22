# brew-infra

Infrastructure as Code for Project Brew on **AWS** (Terraform). Phase 0 ships a
**documented skeleton** — module/environment layout and intended building blocks —
not real provisioning.

## Layout

```
modules/
  network/    # VPC, subnets, security groups, WAF
  data/       # Aurora PostgreSQL (primary), DynamoDB (cart/session), ElastiCache/Redis, S3
  compute/    # ECS Fargate / EKS for the backend, API Gateway in front
  secrets/    # Secrets Manager + KMS keys (field-level PII encryption)
  cdn/        # CloudFront, ACM certs
environments/
  dev/ staging/ prod/   # compose modules per environment
```

## Intended AWS building blocks (§3)

| Concern | Service |
| --- | --- |
| Auth | Cognito (phone+OTP) |
| Edge | API Gateway + WAF + CloudFront |
| Compute | ECS Fargate (or EKS) |
| Transactional store | Aurora PostgreSQL |
| Key-value (cart/session, rate-limit counters) | DynamoDB + ElastiCache/Redis |
| Async events | EventBridge / SNS + SQS |
| Assets/receipts | S3 |
| Secrets & encryption | Secrets Manager + KMS |
| Observability | CloudWatch + OpenTelemetry + CloudTrail |

## Usage (once modules are implemented)

```bash
cd environments/dev
terraform init && terraform plan
```

> Secrets are **never** committed (see root `.gitignore`); they are sourced from
> Secrets Manager / Parameter Store at deploy time.
