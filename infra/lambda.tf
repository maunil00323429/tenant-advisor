resource "aws_iam_role" "lambda_exec" {
  name = "${local.name_prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole"; Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" } }]
  })
  tags = { Project = var.project_name; ManagedBy = "terraform" }
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "dynamodb" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "bedrock" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
}

resource "aws_iam_role_policy" "secrets" {
  name = "${local.name_prefix}-secrets-policy"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow"; Action = ["secretsmanager:GetSecretValue"]
      Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/*"
    }]
  })
}

resource "aws_lambda_function" "api" {
  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")
  function_name    = "${local.name_prefix}-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda_handler.handler"
  runtime          = "python3.12"
  timeout          = var.lambda_timeout
  memory_size      = 512

  environment {
    variables = {
      USE_DYNAMODB     = "true"
      DYNAMODB_TABLE   = aws_dynamodb_table.conversations.name
      BEDROCK_REGION   = var.aws_region
      BEDROCK_MODEL_ID = var.bedrock_model_id
      CLERK_JWKS_URL   = var.clerk_jwks_url
      SECRET_NAME      = "${var.project_name}/config-${terraform.workspace}"
      ENVIRONMENT      = terraform.workspace
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.logs,
    aws_iam_role_policy_attachment.dynamodb,
    aws_iam_role_policy_attachment.bedrock,
  ]
  tags = { Project = var.project_name; ManagedBy = "terraform" }
}
