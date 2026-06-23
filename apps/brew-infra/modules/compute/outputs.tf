output "ecr_repository_url" { value = aws_ecr_repository.backend.repository_url }
output "cluster_name" { value = aws_ecs_cluster.this.name }
output "service_name" { value = aws_ecs_service.backend.name }
output "alb_dns_name" { value = aws_lb.this.dns_name }
output "alb_arn" { value = aws_lb.this.arn }
output "task_role_name" { value = aws_iam_role.task.name }
output "log_group_name" { value = aws_cloudwatch_log_group.backend.name }
