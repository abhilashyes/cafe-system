# Data tier (SKELETON — not provisioning real resources yet).
# Aurora PostgreSQL = primary transactional store; DynamoDB for cart/session;
# ElastiCache/Redis for caching + rate-limit counters; S3 for assets/receipts.

variable "environment" {
  type        = string
  description = "dev | staging | prod"
}

variable "region" {
  type    = string
  default = "ap-south-1" # Mumbai — India data residency (DPDP)
}

# Example placeholders — fill in with real resources in Phase 3.
#
# resource "aws_rds_cluster" "aurora" { ... engine = "aurora-postgresql" ... }
# resource "aws_dynamodb_table" "cart" { ... billing_mode = "PAY_PER_REQUEST" ... }
# resource "aws_elasticache_replication_group" "redis" { ... }
# resource "aws_s3_bucket" "receipts" { ... }

output "note" {
  value = "data module skeleton for ${var.environment} in ${var.region}"
}
