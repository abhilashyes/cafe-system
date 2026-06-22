variable "name_prefix" { type = string }
variable "github_repo" {
  type        = string
  description = "owner/repo allowed to assume the deploy role, e.g. abhilashyes/cafe-system"
}
variable "create_oidc_provider" {
  type        = bool
  default     = true
  description = "Set false if the GitHub OIDC provider already exists in the account."
}
variable "tags" {
  type    = map(string)
  default = {}
}
