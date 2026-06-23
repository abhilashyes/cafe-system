output "alb_dns_name" {
  description = "Public endpoint for the backend API."
  value       = module.compute.alb_dns_name
}
output "ecr_repository_url" {
  description = "Push the backend image here."
  value       = module.compute.ecr_repository_url
}
output "ecs_cluster" { value = module.compute.cluster_name }
output "ecs_service" { value = module.compute.service_name }

output "cognito_user_pool_id" { value = module.identity.user_pool_id }
output "cognito_customer_client_id" { value = module.identity.customer_client_id }
output "cognito_staff_client_id" { value = module.identity.staff_client_id }

output "aurora_endpoint" { value = module.data.aurora_endpoint }
output "redis_endpoint" { value = module.data.redis_primary_endpoint }
output "dynamodb_cart_table" { value = module.data.cart_table_name }
output "event_bus_name" { value = module.messaging.event_bus_name }
output "s3_buckets" { value = module.data.bucket_names }

output "github_deploy_role_arn" {
  description = "Use as role-to-assume in GitHub Actions."
  value       = module.cicd.deploy_role_arn
}

output "pos_cdn_domain" { value = module.cdn_pos.distribution_domain }
output "admin_cdn_domain" { value = module.cdn_admin.distribution_domain }
