# Keyless CI/CD — Workload Identity Federation so GitHub Actions
# (.github/workflows/deploy-gcp.yml) deploys without a service-account key.

resource "google_service_account" "deployer" {
  account_id   = "${var.name_prefix}-deployer"
  display_name = "GitHub Actions deployer"
}

# Roles the deployer needs to build + ship to Cloud Run.
resource "google_project_iam_member" "deployer" {
  for_each = toset([
    "roles/run.admin",
    "roles/cloudbuild.builds.editor",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountUser",
    "roles/storage.admin",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub"
  depends_on                = [google_project_service.enabled]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
  # Only this repo may impersonate the deployer.
  attribute_condition = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Let workflows from the repo impersonate the deployer SA.
resource "google_service_account_iam_member" "wif_bind" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}
