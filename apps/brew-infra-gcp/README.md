# brew-infra-gcp — GCP deployment option (Terraform)

A first-class **GCP** alternative to the AWS stack in `../brew-infra`, sized for
the same **cost-lean pilot**. Region anchor **asia-south1 (Mumbai)** for DPDP
residency. Cloud Run runs the backend container; the rest backs the `live`
profile.

> For a quick **demo deploy without Terraform**, use the one-command Cloud Build
> path in `docs/DEPLOY-GCP.md`. This stack is the **production-grade**, codified
> option (state, IAM, data plane, keyless CI/CD).

## What it provisions
| File | Resources | Profile |
| --- | --- | --- |
| `main.tf` | enables required APIs | all |
| `artifact_registry.tf` | Docker repo for the backend image | all |
| `cloud_run.tf` | backend service + runtime SA + public invoker | all (data wired only in `live`) |
| `network.tf` | VPC, subnet, Serverless VPC connector, private services access | live |
| `database.tf` | Cloud SQL PostgreSQL (private IP, pilot tier) | live (M1) |
| `redis.tf` | Memorystore Redis (BASIC 1 GB) | live (M2) |
| `storage.tf` | GCS buckets (assets, DPDP exports) | live |
| `messaging.tf` | Pub/Sub events topic + DLQ + sample subscription | live (M3) |
| `secrets.tf` | Secret Manager (Razorpay, DB URL) + SA access | live (M4) |
| `identity.tf` | **Identity Platform** (phone OTP + email/MFA) | live (M2) |
| `cicd.tf` | Workload Identity Federation pool + deployer SA | CI/CD |

The Cloud Run service injects DB/Razorpay secrets and VPC egress **only when
`brew_profile = "live"`**, so a `brew_profile = "demo"` apply stands up a working
public demo that needs no database or secrets — the demo-continuity guarantee,
enforced in infra.

## Use
```bash
cd apps/brew-infra-gcp
cp terraform.tfvars.example terraform.tfvars   # fill in project_id, image, etc.
cp backend.hcl.example backend.hcl             # create the GCS state bucket first

terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```
After apply, wire CI/CD by setting the GitHub repo variables from the outputs:
`GCP_PROJECT_ID`, `GCP_DEPLOY_SA` (= `deployer_service_account`),
`GCP_WIF_PROVIDER` (= `wif_provider`). See `docs/DEPLOY-GCP.md` §7.

## AWS ↔ GCP mapping
| AWS (`brew-infra`) | GCP (`brew-infra-gcp`) |
| --- | --- |
| ECS Fargate + ALB | Cloud Run |
| ECR | Artifact Registry |
| Aurora PostgreSQL | Cloud SQL for PostgreSQL |
| ElastiCache Redis | Memorystore for Redis |
| S3 | Cloud Storage |
| EventBridge + SQS/DLQ | Pub/Sub topic + DLQ subscription |
| Cognito | **Identity Platform** |
| Secrets Manager + KMS | Secret Manager |
| WAF | Cloud Armor (add for prod) |
| GitHub OIDC → IAM role | Workload Identity Federation → deployer SA |

## Notes / limits in this environment
- `terraform validate`/`plan` need provider downloads (network), which are blocked
  in the sandbox — files are `terraform fmt`-clean and structured for apply from a
  workstation with `gcloud`/Terraform configured.
- Pilot sizing: Cloud Run min-instances 0, Cloud SQL `db-f1-micro` ZONAL, Redis
  BASIC single node. Production upgrades: Cloud Run min-instances 1, Cloud SQL
  `db-custom-*` REGIONAL HA, Redis STANDARD_HA, Cloud Armor on the service.
