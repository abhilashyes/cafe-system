# Domain-event transport: a custom EventBridge bus + one SQS queue (with DLQ) per
# consumer module. EventBridge rules that route specific events to these queues are
# added per event in Phase 1; the bus + durable queues are the backbone here.

resource "aws_cloudwatch_event_bus" "this" {
  name = "${var.name_prefix}-events"
  tags = var.tags
}

resource "aws_sqs_queue" "dlq" {
  for_each                  = toset(var.consumers)
  name                      = "${var.name_prefix}-${each.key}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = var.kms_key_arn
  tags                      = var.tags
}

resource "aws_sqs_queue" "main" {
  for_each                   = toset(var.consumers)
  name                       = "${var.name_prefix}-${each.key}"
  visibility_timeout_seconds = 60
  kms_master_key_id          = var.kms_key_arn
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 5
  })
  tags = var.tags
}
