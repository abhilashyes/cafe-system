# prod environment (skeleton). Mirrors environments/dev with prod-scoped config.
terraform { required_version = ">= 1.6.0" }
provider "aws" { region = "ap-south-1" }
module "data" { source = "../../modules/data" environment = "prod" }
