variable "project_id" {
  type        = string
  description = "GCP project id to deploy into."
}

variable "region" {
  type        = string
  default     = "asia-south1" # Mumbai — DPDP data residency
  description = "Primary region for all regional resources."
}

variable "name_prefix" {
  type        = string
  default     = "brew-dev"
  description = "Prefix for resource names (e.g. brew-dev, brew-prod)."
}

variable "container_image" {
  type        = string
  default     = "asia-south1-docker.pkg.dev/PROJECT/brew/brew-backend:latest"
  description = "Backend image in Artifact Registry. Set after the first build/push."
}

variable "brew_profile" {
  type        = string
  default     = "demo"
  description = "BREW_PROFILE for the Cloud Run service: demo (mocked) or live."
  validation {
    condition     = contains(["demo", "live"], var.brew_profile)
    error_message = "brew_profile must be \"demo\" or \"live\"."
  }
}

variable "public_invoker" {
  type        = bool
  default     = true
  description = "Allow unauthenticated access to the Cloud Run service (public demo)."
}

variable "github_repo" {
  type        = string
  default     = "abhilashyes/cafe-system"
  description = "owner/repo trusted by Workload Identity Federation for keyless CD."
}

variable "deletion_protection" {
  type        = bool
  default     = true
  description = "Protect the Cloud SQL instance from accidental deletion."
}
