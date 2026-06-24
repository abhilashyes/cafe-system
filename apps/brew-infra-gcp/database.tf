# Cloud SQL for PostgreSQL — the transactional store for the live profile (M1).
# Pilot: smallest shared-core tier, private IP only, single zone.

resource "random_password" "db" {
  length  = 24
  special = false
}

resource "google_sql_database_instance" "main" {
  name             = "${var.name_prefix}-pg"
  database_version = "POSTGRES_15"
  region           = var.region

  deletion_protection = var.deletion_protection

  settings {
    tier              = "db-f1-micro" # pilot; bump to db-custom-* for prod
    availability_type = "ZONAL"       # REGIONAL for prod HA
    disk_autoresize   = true
    disk_size         = 10

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    user_labels = local.labels
  }

  depends_on = [google_service_networking_connection.psa]
}

resource "google_sql_database" "brew" {
  name     = "brew"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = "brew_app"
  instance = google_sql_database_instance.main.name
  password = random_password.db.result
}
