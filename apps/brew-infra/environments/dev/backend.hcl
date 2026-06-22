# Remote-state backend config for `terraform init -backend-config=backend.hcl`.
# Fill in with the outputs from the bootstrap stack (see PREREQUISITES.md §4).
bucket         = "brew-dev-tfstate-<ACCOUNT_ID>"
dynamodb_table = "brew-dev-tflock"
region         = "ap-south-1"
