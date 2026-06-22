output "user_pool_id" { value = aws_cognito_user_pool.this.id }
output "user_pool_arn" { value = aws_cognito_user_pool.this.arn }
output "customer_client_id" { value = aws_cognito_user_pool_client.customer.id }
output "staff_client_id" { value = aws_cognito_user_pool_client.staff.id }
