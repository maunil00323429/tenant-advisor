# Outputs consumed by the CI/CD pipeline (deploy.yml) and useful for manual debugging.
# api_gateway_url is also fed into the frontend build as NEXT_PUBLIC_API_URL.
output "api_gateway_url"     { value = aws_apigatewayv2_api.main.api_endpoint }
output "cloudfront_domain"   { value = aws_cloudfront_distribution.main.domain_name }
output "dynamodb_table_name" { value = aws_dynamodb_table.conversations.name }
output "frontend_bucket"     { value = aws_s3_bucket.frontend.bucket }
output "lambda_name"         { value = aws_lambda_function.api.function_name }
output "secret_name"         { value = aws_secretsmanager_secret.config.name }
