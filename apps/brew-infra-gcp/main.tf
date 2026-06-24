# The Brew Lab — GCP pilot stack (cost-lean), parallel to the AWS brew-infra.
#
# Region anchor: asia-south1 (Mumbai) for DPDP residency. Cloud Run runs the
# backend container; Cloud SQL/Memorystore/Pub/Sub/Secret Manager/Identity
# Platform back the `live` profile (the `demo` profile needs none of them).
#
# NOTE: a single composable stack (not modules) — Cloud Run removes most of the
# networking the AWS ECS stack needs, so the GCP footprint is smaller.

locals {
  labels = {
    project     = "brew"
    environment = "dev"
    managed_by  = "terraform"
  }

  # APIs this stack provisions against.
  services = [
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "pubsub.googleapis.com",
    "identitytoolkit.googleapis.com", # Identity Platform
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ]
}

resource "google_project_service" "enabled" {
  for_each                   = toset(local.services)
  service                    = each.value
  disable_dependent_services = false
  disable_on_destroy         = false
}
