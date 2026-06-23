# Prerequisites — before you `terraform apply`

This guide lists everything you need in place before provisioning the **cost-lean
pilot** (ECS Fargate · greenfield landing zone · ap-south-1). Work top to bottom.

## 1. Tools on your machine
- **Terraform** ≥ 1.6 (`terraform -version`)
- **AWS CLI v2** (`aws --version`)
- **Docker** (to build/push the backend image to ECR)
- Optional: **tflint**, **checkov** (lint/security scan IaC)

## 2. AWS landing zone (one-time, mostly console)
The landing zone is best created with **AWS Control Tower** (clickops/account
factory), not Terraform, because it bootstraps the Organization itself:
1. In the **management account**, enable **AWS Organizations** then launch
   **Control Tower** (home region: `ap-south-1`).
2. Let it create the **log-archive** and **audit/security** accounts.
3. Use **Account Factory** to create workload accounts: `brew-dev`
   (start here for the pilot), later `brew-staging`, `brew-prod`.
4. Enable **IAM Identity Center (SSO)**; create a permission set
   (e.g. `AdministratorAccess` for setup, scoped roles later) and assign your user
   to `brew-dev`.

> If you already have an Org, skip Control Tower and just create/identify the
> `brew-dev` account.

## 3. CLI access to the dev account
Configure an SSO profile and verify you're in the right account/region:
```bash
aws configure sso            # profile name e.g. brew-dev, region ap-south-1
aws sts get-caller-identity --profile brew-dev
export AWS_PROFILE=brew-dev
export AWS_REGION=ap-south-1
```

## 4. Remote state backend (run once per account)
Terraform state lives in S3 with a DynamoDB lock table. Create them with the
**bootstrap** stack (it uses a local backend), then the env stacks use them:
```bash
cd apps/brew-infra/bootstrap
terraform init
terraform apply -var="name_prefix=brew-dev"
# note the outputs: state_bucket, lock_table
```
Put those names into `environments/dev/backend.hcl` (see that file's comments).

## 5. Service quotas & region
- Everything targets **ap-south-1** (Mumbai) for DPDP data residency.
- Default quotas are fine for a pilot (NAT, EIP, Aurora, Fargate). No increases needed.

## 6. Secrets you must supply (never commit)
After apply, the **Secrets Manager** placeholders must be filled with real values:
- `brew/<env>/razorpay` → `{ "keyId": "...", "keySecret": "..." }`
- `brew/<env>/razorpay-webhook` → `{ "secret": "..." }`
```bash
aws secretsmanager put-secret-value --secret-id brew/dev/razorpay \
  --secret-string '{"keyId":"rzp_test_xxx","keySecret":"xxx"}'
```
Aurora's master password is **AWS-managed** (auto-stored in Secrets Manager) — you
don't set it.

## 7. GitHub OIDC (for CI/CD deploys)
The `cicd` module creates the GitHub **OIDC provider** + a deploy **IAM role** so
GitHub Actions deploys without static keys. You only need to confirm the repo:
- Repo: `abhilashyes/cafe-system` (set in `terraform.tfvars`).
- After apply, copy the role ARN output into your workflow's
  `aws-actions/configure-aws-credentials` step (`role-to-assume`).

## 8. (Optional for pilot) DNS & TLS
- A **Route 53** hosted zone for your domain (if you want custom domains).
- An **ACM** cert in `ap-south-1` for the ALB (HTTPS), and one in `us-east-1` for
  CloudFront. The pilot defaults to HTTP on the ALB + CloudFront's default cert; add
  these when you attach a domain.

## 9. Cost guardrails
- Set an **AWS Budget** + alert in the dev account (~$ per month) before applying.
- The pilot is sized lean (single NAT, Aurora Serverless v2 low ACU, single Redis
  node, 1 Fargate task). Validate with the AWS Pricing Calculator.

## 10. Apply order
```bash
# 1) bootstrap (section 4) — once
# 2) the dev environment
cd apps/brew-infra/environments/dev
terraform init -backend-config=backend.hcl
terraform plan  -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
# 3) build & push the backend image to the ECR repo (output: ecr_repository_url)
# 4) re-apply (or let CI deploy) so ECS runs your image instead of the placeholder
```
