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

resource "terraform_data" "later" {
  input = "later-operation"

  provisioner "local-exec" {
    command = var.fail_later ? "printf '%s\n' deliberate-local-failure >&2; exit 23" : "printf '%s\n' later-recovered > later-effect.txt"
  }
}

removed {
  from = terraform_data.first_renamed

  lifecycle {
    destroy = false
  }

  provisioner "local-exec" {
    when    = destroy
    command = "printf '%s\n' destroy-called > first-destroy.txt"
  }
}
