# Object storage — receipts, assets, and DPDP data-export bundles.
resource "google_storage_bucket" "assets" {
  name                        = "${var.name_prefix}-assets-${var.project_id}"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false
  labels                      = local.labels

  versioning {
    enabled = true
  }
}

resource "google_storage_bucket" "exports" {
  name                        = "${var.name_prefix}-exports-${var.project_id}"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false
  labels                      = local.labels

  # DPDP: data-export bundles are short-lived.
  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }
}
