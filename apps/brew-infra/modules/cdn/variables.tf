variable "name_prefix" { type = string }
variable "site" {
  type        = string
  description = "logical site name, e.g. pos or admin"
}
variable "tags" {
  type    = map(string)
  default = {}
}
