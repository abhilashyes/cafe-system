# KMS CMK (at-rest + field-level PII encryption) and Secrets Manager placeholders.
# Secret VALUES are populated out-of-band (see PREREQUISITES.md) — never in code.

resource "aws_kms_key" "main" {
  description             = "${var.name_prefix} primary CMK"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_secretsmanager_secret" "razorpay" {
  name        = "brew/${var.environment}/razorpay"
  description = "Razorpay keyId/keySecret"
  kms_key_id  = aws_kms_key.main.arn
  tags        = var.tags
}

resource "aws_secretsmanager_secret_version" "razorpay" {
  secret_id     = aws_secretsmanager_secret.razorpay.id
  secret_string = jsonencode({ keyId = "REPLACE_ME", keySecret = "REPLACE_ME" })
  lifecycle {
    ignore_changes = [secret_string] # real value set via CLI/console
  }
}

resource "aws_secretsmanager_secret" "razorpay_webhook" {
  name        = "brew/${var.environment}/razorpay-webhook"
  description = "Razorpay webhook signing secret"
  kms_key_id  = aws_kms_key.main.arn
  tags        = var.tags
}

resource "aws_secretsmanager_secret_version" "razorpay_webhook" {
  secret_id     = aws_secretsmanager_secret.razorpay_webhook.id
  secret_string = jsonencode({ secret = "REPLACE_ME" })
  lifecycle {
    ignore_changes = [secret_string]
  }
}
