# Project Brew — dev/pilot environment (cost-lean). Composes the shared modules.

locals {
  environment = "dev"
  tags = {
    Project     = "brew"
    Environment = local.environment
    ManagedBy   = "terraform"
  }
  container_port = 3000
}

module "network" {
  source         = "../../modules/network"
  name_prefix    = var.name_prefix
  az_count       = 2
  single_nat     = true # pilot cost saver
  container_port = local.container_port
  tags           = local.tags
}

module "secrets" {
  source      = "../../modules/secrets"
  name_prefix = var.name_prefix
  environment = local.environment
  tags        = local.tags
}

module "data" {
  source                  = "../../modules/data"
  name_prefix             = var.name_prefix
  environment             = local.environment
  data_subnet_ids         = module.network.data_subnet_ids
  db_security_group_id    = module.network.db_sg_id
  redis_security_group_id = module.network.redis_sg_id
  kms_key_arn             = module.secrets.kms_key_arn
  # pilot sizing defaults (low ACU, single node) come from the module
  tags = local.tags
}

module "identity" {
  source      = "../../modules/identity"
  name_prefix = var.name_prefix
  tags        = local.tags
}

module "messaging" {
  source      = "../../modules/messaging"
  name_prefix = var.name_prefix
  kms_key_arn = module.secrets.kms_key_arn
  tags        = local.tags
}

module "compute" {
  source             = "../../modules/compute"
  name_prefix        = var.name_prefix
  environment        = local.environment
  region             = var.region
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
  alb_sg_id          = module.network.alb_sg_id
  app_sg_id          = module.network.app_sg_id
  container_port     = local.container_port
  desired_count      = 1 # pilot
  container_image    = var.container_image
  kms_key_arn        = module.secrets.kms_key_arn
  secret_arns = [
    module.secrets.razorpay_secret_arn,
    module.secrets.razorpay_webhook_secret_arn,
    module.data.aurora_master_secret_arn,
  ]
  tags = local.tags
}

module "waf" {
  source      = "../../modules/waf"
  name_prefix = var.name_prefix
  alb_arn     = module.compute.alb_arn
  tags        = local.tags
}

module "cicd" {
  source      = "../../modules/cicd"
  name_prefix = var.name_prefix
  github_repo = var.github_repo
  tags        = local.tags
}

# Static hosting for the two React apps.
module "cdn_pos" {
  source      = "../../modules/cdn"
  name_prefix = var.name_prefix
  site        = "pos"
  tags        = local.tags
}

module "cdn_admin" {
  source      = "../../modules/cdn"
  name_prefix = var.name_prefix
  site        = "admin"
  tags        = local.tags
}
