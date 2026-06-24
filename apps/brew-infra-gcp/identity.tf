# Identity Platform — GCP's managed auth (productized Firebase Auth). This is the
# `live`-profile replacement for the mock Cognito adapter (M2):
#   - customers: phone number + SMS OTP
#   - staff: email/password + MFA (configured in the console/admin)
# The backend verifies Identity Platform ID tokens (JWTs) via Google's JWKS, so
# the LiveAuthAdapter swaps in behind the existing AuthAdapter port.
#
# Requires Identity Platform enabled on the project (billing). google-beta.
resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = true
      password_required = true
    }

    phone_number {
      enabled            = true
      test_phone_numbers = {} # add "+91…" => "000000" pairs for E2E tests
    }
  }

  depends_on = [google_project_service.enabled]
}
