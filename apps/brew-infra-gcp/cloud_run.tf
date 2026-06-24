# Backend service on Cloud Run (scale-to-zero pilot). In the `demo` profile it
# needs no other resource; in `live` it also gets DB/Redis/Razorpay wired in from
# Secret Manager and VPC egress to the private Cloud SQL/Memorystore.

resource "google_service_account" "backend" {
  account_id   = "${var.name_prefix}-backend"
  display_name = "brew-backend Cloud Run runtime"
}

resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.name_prefix}-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend.email
    labels          = local.labels

    scaling {
      min_instance_count = 0 # scale to zero — pay per request
      max_instance_count = 2 # pilot ceiling
    }

    # Private VPC egress only needed for the live data plane.
    dynamic "vpc_access" {
      for_each = var.brew_profile == "live" ? [1] : []
      content {
        connector = google_vpc_access_connector.serverless.id
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    containers {
      image = var.container_image
      ports {
        container_port = 3000
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "BREW_PROFILE"
        value = var.brew_profile
      }

      # Secrets are injected only for the live profile.
      dynamic "env" {
        for_each = var.brew_profile == "live" ? [1] : []
        content {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.database_url.secret_id
              version = "latest"
            }
          }
        }
      }
      dynamic "env" {
        for_each = var.brew_profile == "live" ? [1] : []
        content {
          name = "RAZORPAY_KEYS"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.razorpay.secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  depends_on = [google_project_service.enabled]
}

# Public demo: allow unauthenticated invocations (toggle with public_invoker).
resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.public_invoker ? 1 : 0
  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
