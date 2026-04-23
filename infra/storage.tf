# Storage resources — DynamoDB (conversations), S3 (frontend static files), Secrets Manager (config).

# Conversation history table — keyed by session_id, auto-deletes after the TTL set in dynamo_memory.py.
# PAY_PER_REQUEST avoids provisioned capacity management for a low-traffic app.
resource "aws_dynamodb_table" "conversations" {
  name         = "${local.name_prefix}-conversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"

  attribute { name = "session_id"; type = "S" }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = { Project = var.project_name; ManagedBy = "terraform" }
}

# S3 bucket for the static Next.js export — served via CloudFront.
# Account ID in the name ensures global uniqueness.
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
  tags   = { Project = var.project_name; ManagedBy = "terraform" }
}

# S3 website hosting — both index and error point to index.html for SPA client-side routing
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document { suffix = "index.html" }
  error_document { key    = "index.html" }
}

# Public access is required because CloudFront uses the S3 website endpoint (not OAI)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_public" {
  bucket     = aws_s3_bucket.frontend.id
  depends_on = [aws_s3_bucket_public_access_block.frontend]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Sid = "PublicRead"; Effect = "Allow"; Principal = "*"
      Action = "s3:GetObject"; Resource = "${aws_s3_bucket.frontend.arn}/*" }]
  })
}

# Secrets Manager — holds runtime config (e.g. CORS_ORIGINS) that server.py reads via secrets.py.
# The placeholder value is set on first apply; update manually in the console afterward.
resource "aws_secretsmanager_secret" "config" {
  name                    = "${var.project_name}/config-${terraform.workspace}"
  description             = "Runtime config for ${var.project_name} (${terraform.workspace})"
  recovery_window_in_days = 0 # allow immediate delete/recreate during development
}

# Initial secret value — lifecycle ignore_changes prevents Terraform from overwriting manual edits
resource "aws_secretsmanager_secret_version" "config" {
  secret_id     = aws_secretsmanager_secret.config.id
  secret_string = jsonencode({ CORS_ORIGINS = "REPLACE_WITH_CLOUDFRONT_URL_AFTER_APPLY" })
  lifecycle { ignore_changes = [secret_string] }
}
