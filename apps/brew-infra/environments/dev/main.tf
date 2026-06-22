# dev environment (SKELETON). Composes the shared modules.
# Real backend/state config (S3 + DynamoDB lock) wired in Phase 3.

terraform {
  required_version = ">= 1.6.0"
  # backend "s3" { bucket = "brew-tfstate-dev" key = "dev/terraform.tfstate" region = "ap-south-1" }
}

provider "aws" {
  region = "ap-south-1"
}

module "data" {
  source      = "../../modules/data"
  environment = "dev"
}

# module "network" { source = "../../modules/network" ... }
# module "compute" { source = "../../modules/compute" ... }
# module "secrets" { source = "../../modules/secrets" ... }
# module "cdn"     { source = "../../modules/cdn" ... }
