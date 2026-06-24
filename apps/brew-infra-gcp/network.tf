# Private networking so Cloud Run can reach Cloud SQL + Memorystore over private
# IP via a Serverless VPC Access connector. (The demo profile uses neither, but
# the connector + private services access are needed for the live profile.)

resource "google_compute_network" "vpc" {
  name                    = "${var.name_prefix}-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.enabled]
}

resource "google_compute_subnetwork" "app" {
  name          = "${var.name_prefix}-app"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Serverless VPC Access connector — lets Cloud Run egress into the VPC.
resource "google_vpc_access_connector" "serverless" {
  name          = "${var.name_prefix}-conn"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.10.8.0/28"
  min_instances = 2
  max_instances = 3
  depends_on    = [google_project_service.enabled]
}

# Private Services Access range for Cloud SQL private IP.
resource "google_compute_global_address" "private_ip" {
  name          = "${var.name_prefix}-psa"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "psa" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]
}
