variable "name_prefix" { type = string }
variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}
variable "az_count" {
  type    = number
  default = 2
}
variable "single_nat" {
  type        = bool
  default     = true
  description = "Cost-lean pilot: one shared NAT gateway instead of one per AZ."
}
variable "container_port" {
  type    = number
  default = 3000
}
variable "tags" {
  type    = map(string)
  default = {}
}
