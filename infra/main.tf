# Root Terraform configuration for the Tenant Advisor AWS infrastructure.
# Uses Terraform workspaces (dev / prod) to namespace all resource names.

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources used to inject account ID and region into resource ARNs
data "aws_caller_identity" "current" {}
data "aws_region"          "current" {}

# Naming convention: "<project>-<workspace>" keeps dev and prod resources separate
locals {
  name_prefix  = "${var.project_name}-${terraform.workspace}"
  s3_origin_id = "${var.project_name}-s3-${terraform.workspace}"
}
