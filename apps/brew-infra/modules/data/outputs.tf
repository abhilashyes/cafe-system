output "aurora_endpoint" { value = aws_rds_cluster.this.endpoint }
output "aurora_reader_endpoint" { value = aws_rds_cluster.this.reader_endpoint }
output "aurora_master_secret_arn" { value = aws_rds_cluster.this.master_user_secret[0].secret_arn }
output "cart_table_name" { value = aws_dynamodb_table.cart.name }
output "session_table_name" { value = aws_dynamodb_table.session.name }
output "redis_primary_endpoint" { value = aws_elasticache_replication_group.this.primary_endpoint_address }
output "bucket_names" { value = { for k, b in aws_s3_bucket.this : k => b.id } }
output "bucket_arns" { value = { for k, b in aws_s3_bucket.this : k => b.arn } }
