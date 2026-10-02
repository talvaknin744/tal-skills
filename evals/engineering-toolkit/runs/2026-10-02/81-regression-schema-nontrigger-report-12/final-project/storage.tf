# Bucket for audit logs.
resource "aws_s3_bucket" "audit" {
  bucket = "synthetic-audit-example"
  tags = { purpose = "audit" }
}
