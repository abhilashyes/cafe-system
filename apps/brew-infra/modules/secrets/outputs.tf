output "kms_key_arn" { value = aws_kms_key.main.arn }
output "razorpay_secret_arn" { value = aws_secretsmanager_secret.razorpay.arn }
output "razorpay_webhook_secret_arn" { value = aws_secretsmanager_secret.razorpay_webhook.arn }
