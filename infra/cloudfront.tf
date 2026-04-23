# CloudFront CDN — serves the static Next.js export from S3.
# PriceClass_100 limits edge locations to North America & Europe to reduce cost.

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  # Origin: S3 website hosting endpoint (HTTP-only because S3 website doesn't support HTTPS)
  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = local.s3_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Cache all static assets; no query strings or cookies forwarded to S3
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  # SPA fallback — 403/404 from S3 are rewritten to index.html so client-side
  # routing (Next.js pages) works for deep links and browser refreshes.
  custom_error_response {
    error_code         = 403
    response_page_path = "/index.html"
    response_code      = 200
  }

  custom_error_response {
    error_code         = 404
    response_page_path = "/index.html"
    response_code      = 200
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  # Uses the default *.cloudfront.net certificate; swap for ACM cert when adding a custom domain
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Project   = var.project_name
    ManagedBy = "terraform"
  }
}
