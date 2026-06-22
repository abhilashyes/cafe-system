# Data tier: Aurora PostgreSQL Serverless v2 (primary), DynamoDB (cart/session),
# ElastiCache Redis (cache/rate-limit), and S3 buckets (receipts/assets/exports).
# Pilot sizing: low ACU, single Aurora instance, single Redis node.

data "aws_caller_identity" "current" {}

# --- Aurora PostgreSQL Serverless v2 ---
resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-aurora"
  subnet_ids = var.data_subnet_ids
  tags       = var.tags
}

resource "aws_rds_cluster" "this" {
  cluster_identifier            = "${var.name_prefix}-aurora"
  engine                        = "aurora-postgresql"
  engine_mode                   = "provisioned" # required for Serverless v2 scaling
  engine_version                = "15.4"
  database_name                 = var.db_name
  master_username               = var.db_master_username
  manage_master_user_password   = true # password auto-stored in Secrets Manager
  master_user_secret_kms_key_id = var.kms_key_arn
  db_subnet_group_name          = aws_db_subnet_group.this.name
  vpc_security_group_ids        = [var.db_security_group_id]
  storage_encrypted             = true
  kms_key_id                    = var.kms_key_arn
  backup_retention_period       = 7
  skip_final_snapshot           = true # pilot; set false + final_snapshot_identifier for prod
  apply_immediately             = true

  serverlessv2_scaling_configuration {
    min_capacity = var.aurora_min_acu
    max_capacity = var.aurora_max_acu
  }

  tags = var.tags
}

resource "aws_rds_cluster_instance" "this" {
  count                = var.aurora_instance_count
  identifier           = "${var.name_prefix}-aurora-${count.index}"
  cluster_identifier   = aws_rds_cluster.this.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.this.engine
  engine_version       = aws_rds_cluster.this.engine_version
  db_subnet_group_name = aws_db_subnet_group.this.name
  tags                 = var.tags
}

# --- DynamoDB (key-value: cart + session) ---
resource "aws_dynamodb_table" "cart" {
  name         = "${var.name_prefix}-cart"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }
  tags = var.tags
}

resource "aws_dynamodb_table" "session" {
  name         = "${var.name_prefix}-session"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }
  tags = var.tags
}

# --- ElastiCache Redis (single node for pilot) ---
resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name_prefix}-redis"
  subnet_ids = var.data_subnet_ids
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id       = "${var.name_prefix}-redis"
  description                = "${var.name_prefix} Redis (cache + rate-limit)"
  engine                     = "redis"
  node_type                  = var.redis_node_type
  num_cache_clusters         = 1     # pilot: single node
  automatic_failover_enabled = false # requires >=2 nodes
  multi_az_enabled           = false
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.this.name
  security_group_ids         = [var.redis_security_group_id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                 = var.kms_key_arn
  tags                       = var.tags
}

# --- S3 buckets ---
locals {
  buckets = toset(["receipts", "assets", "exports"])
}

resource "aws_s3_bucket" "this" {
  for_each = local.buckets
  bucket   = "${var.name_prefix}-${each.key}-${data.aws_caller_identity.current.account_id}"
  tags     = var.tags
}

resource "aws_s3_bucket_versioning" "this" {
  for_each = aws_s3_bucket.this
  bucket   = each.value.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  for_each = aws_s3_bucket.this
  bucket   = each.value.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  for_each                = aws_s3_bucket.this
  bucket                  = each.value.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
