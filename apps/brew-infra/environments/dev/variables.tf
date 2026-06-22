variable "region" {
  type    = string
  default = "ap-south-1"
}
variable "name_prefix" {
  type    = string
  default = "brew-dev"
}
variable "github_repo" {
  type    = string
  default = "abhilashyes/cafe-system"
}
variable "container_image" {
  type        = string
  default     = "public.ecr.aws/nginx/nginx:latest"
  description = "Override with the ECR image once the backend is pushed."
}
