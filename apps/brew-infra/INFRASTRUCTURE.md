# Project Brew — Cloud Infrastructure Specification

Region anchor: **ap-south-1 (Mumbai)** for DPDP data residency. This reflects the
chosen options; the layout in `brew-infra` (modules + environments) implements it.

## Chosen options
| Decision | Choice |
| --- | --- |
| Compute platform | **ECS Fargate** (serverless containers, lowest ops for a modular monolith) |
| AWS accounts | **Greenfield landing zone** — AWS Organizations + Control Tower, separate dev/staging/prod accounts + guardrails |
| Launch scale & HA | **Pilot, cost-lean** (5–20 stores): single-AZ where safe, Aurora Serverless v2 min capacity, minimal NATs |
| CI/CD & monitoring | **GitHub Actions** (OIDC, no static keys) + **CloudWatch + OpenTelemetry** |

## Account / landing zone
- **AWS Organizations** with OUs: `Security`, `Infrastructure`, `Workloads`.
- **Control Tower** for guardrails + account factory.
- Accounts: `management`, `log-archive`, `audit/security`, `brew-dev`, `brew-staging`, `brew-prod`.
- **IAM Identity Center (SSO)** for human access; **IAM roles + GitHub OIDC** for CI.

## Networking & edge (per workload account)
- **VPC** with public + private (app) + isolated (data) subnets across 2 AZs.
  - *Pilot cost-lean:* **1 NAT gateway** (not per-AZ); accept single-AZ NAT risk in dev/pilot.
- **Route 53** (DNS) + **ACM** (TLS certs).
- **CloudFront** in front of the React apps (S3 origin) and the API.
- **API Gateway (HTTP API)** or **ALB** fronting Fargate — validates Cognito JWT, throttling.
- **AWS WAF** on the edge — OWASP managed rules, rate limiting, OTP/order endpoint protection.

## Compute
- **ECS Fargate** service for `brew-backend` (autoscaling on CPU/req; pilot min=1–2 tasks).
- **ECR** repository with image scan-on-push.
- **EventBridge Scheduler → Fargate task** for cron jobs (DPDP retention/erasure,
  loyalty qualifying-period rollups, EOD reconciliation).

## Data & cache
- **Aurora PostgreSQL Serverless v2** (primary store) — *pilot:* low min ACU,
  single writer; **single-AZ in dev**, enable Multi-AZ at production cutover.
- **DynamoDB** (on-demand) — cart/session, rate-limit counters.
- **ElastiCache for Redis** — caching + OTP throttle counters (*pilot:* single small node).
- **S3** buckets — receipts, assets, data-export bundles, ALB/CloudFront logs,
  **Terraform remote state** (+ DynamoDB state-lock table).

## Identity, messaging, async
- **Amazon Cognito** user pool — phone+OTP for customers, MFA for staff.
- **EventBridge** (default + custom bus) as the prod domain-event transport;
  **SQS** queues per consumer + **DLQs**; **SNS** for fan-out where needed.
- **Amazon SNS (SMS) / Pinpoint** for notifications; OTP SMS delegated to Cognito.

## Security & secrets
- **Secrets Manager** (Razorpay keys, DB creds) + **KMS** CMKs (at-rest + field-level PII).
- **IAM** least-privilege task roles per module boundary.
- **CloudTrail** (org-wide → log-archive), **GuardDuty**, **Security Hub**, **AWS Config**.

## Observability
- **CloudWatch** logs/metrics/alarms/dashboards.
- **OpenTelemetry** SDK in the backend → **ADOT collector** → CloudWatch / X-Ray traces.

## CI/CD (GitHub Actions)
- OIDC trust to per-account deploy roles (no long-lived keys).
- Pipeline: install → test → SAST/SCA + image scan → build/push to ECR →
  `terraform plan/apply` (env-gated) → ECS **blue/green** (CodeDeploy) or rolling.
- Terraform state in S3 + DynamoDB lock; plan on PR, apply on merge per environment.

## Pilot → production upgrade path
Flip these when graduating from pilot to multi-AZ production (no redesign):
1. NAT gateway per-AZ; 2. Aurora Multi-AZ + read replica; 3. Redis multi-node w/ failover;
4. ECS min tasks ↑ + spread across AZs; 5. WAF rate limits tuned; 6. (later) multi-region DR.

## Cost-lean pilot notes
Biggest savers active now: single NAT, Aurora Serverless v2 (scales to low ACU),
DynamoDB/SNS on-demand, Redis single node, Fargate min tasks, CloudFront caching to
cut egress. Estimate to validate with AWS Pricing Calculator before apply.
