# Docker image registry for the backend container.
resource "google_artifact_registry_repository" "images" {
  repository_id = "brew"
  location      = var.region
  format        = "DOCKER"
  description   = "The Brew Lab container images"
  labels        = local.labels
  depends_on    = [google_project_service.enabled]
}
