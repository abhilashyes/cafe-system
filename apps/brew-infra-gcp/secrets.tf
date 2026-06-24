# Secret Manager — Razorpay keys + the DB connection string. The DB URL is
# populated by Terraform; Razorpay keys are filled in out-of-band (never in code).

resource "google_secret_manager_secret" "razorpay" {
  secret_id = "${var.name_prefix}-razorpay"
  labels    = local.labels
  replication {
    auto {}
  }
  depends_on = [google_project_service.enabled]
}

# Placeholder value so the secret exists; replace with real keys via the console
# or `gcloud secrets versions add`. JSON: {"keyId":"...","keySecret":"...","webhookSecret":"..."}
resource "google_secret_manager_secret_version" "razorpay_placeholder" {
  secret      = google_secret_manager_secret.razorpay.id
  secret_data = jsonencode({ keyId = "REPLACE_ME", keySecret = "REPLACE_ME", webhookSecret = "REPLACE_ME" })
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "${var.name_prefix}-database-url"
  labels    = local.labels
  replication {
    auto {}
  }
  depends_on = [google_project_service.enabled]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret = google_secret_manager_secret.database_url.id
  # Private-IP connection string for the app user.
  secret_data = "postgresql://${google_sql_user.app.name}:${random_password.db.result}@${google_sql_database_instance.main.private_ip_address}:5432/${google_sql_database.brew.name}"
}

# Let the Cloud Run runtime SA read the secrets it consumes.
resource "google_secret_manager_secret_iam_member" "backend_razorpay" {
  secret_id = google_secret_manager_secret.razorpay.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_secret_manager_secret_iam_member" "backend_database_url" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}
