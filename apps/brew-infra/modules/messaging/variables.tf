variable "name_prefix" { type = string }
variable "kms_key_arn" { type = string }
variable "consumers" {
  type    = list(string)
  default = ["inventory", "loyalty", "kot", "reporting", "notifications"]
}
variable "tags" {
  type    = map(string)
  default = {}
}
