# Pub/Sub — the prod domain-event transport for the live profile (M3), replacing
# the in-memory EventBus. One events topic + a dead-letter topic; consumers add
# their own subscriptions. Mirrors the EventBridge/SQS+DLQ intent on AWS.

resource "google_pubsub_topic" "events" {
  name       = "${var.name_prefix}-domain-events"
  labels     = local.labels
  depends_on = [google_project_service.enabled]
}

resource "google_pubsub_topic" "events_dlq" {
  name   = "${var.name_prefix}-domain-events-dlq"
  labels = local.labels
}

# Example consumer subscription with dead-lettering + retry. Each domain
# consumer (KOT, inventory, loyalty, reporting) gets one like this in M3.
resource "google_pubsub_subscription" "fulfilment" {
  name  = "${var.name_prefix}-fulfilment"
  topic = google_pubsub_topic.events.id

  ack_deadline_seconds       = 30
  message_retention_duration = "86400s"

  retry_policy {
    minimum_backoff = "5s"
    maximum_backoff = "300s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.events_dlq.id
    max_delivery_attempts = 5
  }
}
