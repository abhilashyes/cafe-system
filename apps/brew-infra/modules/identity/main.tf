# Cognito user pool: phone-number as username (customer phone+OTP), staff MFA.
# Passwordless phone-OTP for customers uses custom-auth Lambda triggers added in
# Phase 1; this provisions the pool + app clients with the right auth flows.

resource "aws_cognito_user_pool" "this" {
  name                     = "${var.name_prefix}-users"
  username_attributes      = ["phone_number"]
  auto_verified_attributes = ["phone_number"]

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 1
    }
  }

  # SMS is required for phone verification; the role/config is attached in Phase 1
  # together with the custom-auth Lambdas. Staff MFA uses TOTP to avoid SMS cost.
  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration {
    enabled = true
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  tags = var.tags
}

# Customer app client (mobile + web) — public client, no secret.
resource "aws_cognito_user_pool_client" "customer" {
  name         = "${var.name_prefix}-customer"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_CUSTOM_AUTH", # passwordless phone OTP
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
  access_token_validity  = 1 # hours
  id_token_validity      = 1
  refresh_token_validity = 30 # days
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

# Staff client (POS / admin).
resource "aws_cognito_user_pool_client" "staff" {
  name         = "${var.name_prefix}-staff"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 7
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}
