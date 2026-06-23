variable "name_prefix" { type = string }
variable "alb_arn" { type = string }
variable "rate_limit" {
  type    = number
  default = 2000 # requests / 5 min / IP
}
variable "tags" {
  type    = map(string)
  default = {}
}
