variable "name_prefix" { type = string }
variable "environment" { type = string }
variable "region" { type = string }

variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "alb_sg_id" { type = string }
variable "app_sg_id" { type = string }

variable "container_port" {
  type    = number
  default = 3000
}
variable "desired_count" {
  type    = number
  default = 1 # pilot
}
variable "cpu" {
  type    = number
  default = 512
}
variable "memory" {
  type    = number
  default = 1024
}

# Placeholder image so the service starts before the real image is pushed to ECR.
variable "container_image" {
  type    = string
  default = "public.ecr.aws/nginx/nginx:latest"
}

# ARNs the task is allowed to read/use.
variable "secret_arns" {
  type    = list(string)
  default = []
}
variable "kms_key_arn" { type = string }

variable "tags" {
  type    = map(string)
  default = {}
}
