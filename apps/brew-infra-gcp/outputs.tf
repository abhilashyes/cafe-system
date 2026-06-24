output "backend_url" {
  value       = google_cloud_run_v2_service.backend.uri
  description = "Public URL of the Cloud Run backend."
}

output "artifact_registry" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
  description = "Docker image path prefix for the backend."
}

output "sql_connection_name" {
  value       = google_sql_database_instance.main.connection_name
  description = "Cloud SQL instance connection name."
}

output "redis_host" {
  value       = google_redis_instance.cache.host
  description = "Memorystore Redis private host."
}

output "wif_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Set as the GCP_WIF_PROVIDER GitHub repo variable."
}

output "deployer_service_account" {
  value       = google_service_account.deployer.email
  description = "Set as the GCP_DEPLOY_SA GitHub repo variable."
}
