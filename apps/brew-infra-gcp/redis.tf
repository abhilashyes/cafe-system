# Memorystore for Redis — caching + OTP throttle counters (live profile, M2).
# Pilot: BASIC tier (no replica), 1 GB, on the private VPC.
resource "google_redis_instance" "cache" {
  name               = "${var.name_prefix}-redis"
  tier               = "BASIC"
  memory_size_gb     = 1
  region             = var.region
  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  redis_version      = "REDIS_7_0"
  labels             = local.labels

  depends_on = [google_service_networking_connection.psa]
}
