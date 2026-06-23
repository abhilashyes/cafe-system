# prod environment.
#
# Mirror environments/dev (same module composition) with prod-scoped values and the
# multi-AZ HA posture from INFRASTRUCTURE.md (pilot → production upgrade path):
#   - name_prefix      = "brew-prod"
#   - network.single_nat = false                 # NAT per AZ
#   - data: aurora_instance_count = 2 (Multi-AZ), higher max ACU; redis multi-node
#   - compute.desired_count >= 2, autoscaling
#   - WAF rate limits tuned; ALB HTTPS with ACM cert
#   - backend.hcl bucket/lock for the prod account
#
# Left intentionally empty so `terraform` here is a no-op until promoted.
terraform {
  required_version = ">= 1.6.0"
}
