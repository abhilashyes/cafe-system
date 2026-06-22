variable "name_prefix" { type = string }
variable "environment" { type = string }
variable "data_subnet_ids" { type = list(string) }
variable "db_security_group_id" { type = string }
variable "redis_security_group_id" { type = string }
variable "kms_key_arn" { type = string }

variable "db_name" {
  type    = string
  default = "brew"
}
variable "db_master_username" {
  type    = string
  default = "brew_admin"
}
variable "aurora_min_acu" {
  type    = number
  default = 0.5 # pilot floor
}
variable "aurora_max_acu" {
  type    = number
  default = 4
}
variable "aurora_instance_count" {
  type    = number
  default = 1 # pilot: single instance, single-AZ
}
variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}
variable "tags" {
  type    = map(string)
  default = {}
}
