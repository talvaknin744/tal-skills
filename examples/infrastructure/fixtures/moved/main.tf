terraform {
  required_version = "= 1.16.4"
}

variable "fail_later" {
  type    = bool
  default = true
}

variable "first_value" {
  type    = string
  default = "original"
}

resource "terraform_data" "first_renamed" {
  input = var.first_value

  provisioner "local-exec" {
    command = "printf '%s\n' first-created >> first-events.txt"
  }

  provisioner "local-exec" {
    when    = destroy
    command = "printf '%s\n' destroy-called > first-destroy.txt"
  }
}

resource "terraform_data" "later" {
  depends_on = [terraform_data.first_renamed]
  input      = "later-operation"

  provisioner "local-exec" {
    command = var.fail_later ? "printf '%s\n' deliberate-local-failure >&2; exit 23" : "printf '%s\n' later-recovered > later-effect.txt"
  }
}

moved {
  from = terraform_data.first
  to   = terraform_data.first_renamed
}
