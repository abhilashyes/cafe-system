# brew-infra

Infrastructure as Code for Project Brew on **AWS** (Terraform).

- **What to do first:** [`PREREQUISITES.md`](./PREREQUISITES.md)
- **What gets built & why:** [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md)
  (ECS Fargate · greenfield landing zone · cost-lean pilot · GitHub Actions + CloudWatch/OTel)

The **`dev`/pilot** environment is implemented as real, composable modules. `staging`
and `prod` are documented promotions of the same composition (multi-AZ HA).

## Layout

```
bootstrap/                # one-off: S3 state bucket + DynamoDB lock (local backend)
modules/
  network/    # VPC, public/private/data subnets, 1 NAT (pilot), all security groups
  secrets/    # KMS CMK + Secrets Manager placeholders (Razorpay)
  data/       # Aurora PostgreSQL Serverless v2, DynamoDB (cart/session), Redis, S3
  identity/   # Cognito user pool + customer/staff app clients
  messaging/  # EventBridge bus + per-consumer SQS queues with DLQs
  compute/    # ECR, ECS Fargate service, ALB, IAM task/exec roles, CloudWatch logs
  waf/        # Regional WAFv2 web ACL on the ALB (managed rules + IP rate limit)
  cicd/       # GitHub Actions OIDC provider + deploy role
  cdn/        # S3 + CloudFront (OAC) static hosting for a React app
environments/
  dev/        # pilot composition (this is the one that's runnable)
  staging/    # documented promotion (mirror dev, multi-AZ)
  prod/       # documented promotion (mirror dev, multi-AZ + HTTPS)
```

## Usage

```bash
# 0) prerequisites: landing zone + CLI access (see PREREQUISITES.md)

# 1) remote-state backend (once per account)
cd bootstrap
terraform init && terraform apply -var="name_prefix=brew-dev"
#   -> copy state_bucket / lock_table into environments/dev/backend.hcl

# 2) the pilot environment
cd ../environments/dev
cp terraform.tfvars.example terraform.tfvars      # edit if needed
terraform init -backend-config=backend.hcl
terraform plan
terraform apply

# 3) build & push the backend image to the ECR repo (output: ecr_repository_url),
#    set container_image (or let CI/CD deploy), then re-apply.
```

## Cost-lean pilot knobs (in `environments/dev`)
`network.single_nat = true`, Aurora Serverless v2 low ACU + single instance, single
Redis node, 1 Fargate task, ALB HTTP (no ACM yet). Flip these per
[`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md) "pilot → production" to graduate.

## Notes
- Validated locally with `terraform fmt`. Full `terraform validate`/`plan` needs the
  AWS provider from the Terraform registry — run it in your environment.
- Secrets are **never** committed (`*.tfvars`, `.terraform/`, state are gitignored);
  real secret values are set via the AWS CLI/console after apply.
- Region: **ap-south-1** (Mumbai) for DPDP data residency.
