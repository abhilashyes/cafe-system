# staging environment.
#
# Mirror environments/dev (same module composition) with staging-scoped values and
# production-leaning sizing. To stand it up, copy dev's versions.tf / main.tf /
# variables.tf / outputs.tf here and adjust:
#   - name_prefix      = "brew-staging"
#   - network.single_nat = false          # one NAT per AZ
#   - data: aurora_instance_count = 2, Multi-AZ; redis num nodes >= 2
#   - compute.desired_count = 2
#   - backend.hcl bucket/lock for the staging account
#
# Left intentionally empty so `terraform` here is a no-op until promoted.
terraform {
  required_version = ">= 1.6.0"
}
