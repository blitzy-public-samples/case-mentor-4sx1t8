# Human Tasks:
# 1. Verify S3 bucket 'case-interview-terraform-state' exists for state management
# 2. Ensure DynamoDB table 'terraform-state-lock' is configured for state locking
# 3. Configure Vercel, Supabase, and Upstash provider credentials in environment
# 4. Review staging resource allocations match pre-production requirements

# Requirement: Staging Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Configure Terraform backend and providers
terraform {
  backend "s3" {
    bucket         = "case-interview-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }

  required_providers {
    # Vercel provider version ~> 1.0
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    
    # Supabase provider version ~> 1.0
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    
    # Upstash provider version ~> 1.0
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
  }
}

# Requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
# Define staging-specific local variables
locals {
  environment           = "staging"
  project_name         = "case-interview-platform-staging"
  database_instance_size = "db-2cpu-4gb"
  redis_instance_size   = "cache.t3.small"
  redis_ttl            = "3600"
  storage_bucket_name  = "case-interview-assets-staging"
  common_tags = {
    Project     = "Case Interview Platform"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# Configure database module with staging-appropriate resources
module "database" {
  source = "../../modules/database"
  
  project_name           = local.project_name
  environment           = local.environment
  instance_size         = local.database_instance_size
  max_connections       = 50
  backup_retention_days = 7
  point_in_time_recovery = true
}

# Configure cache module with staging-appropriate resources
module "cache" {
  source = "../../modules/cache"
  
  project_name      = local.project_name
  environment       = local.environment
  instance_size     = local.redis_instance_size
  ttl              = local.redis_ttl
  max_memory       = "2gb"
  max_connections  = 100
}

# Configure storage module with staging-appropriate resources
module "storage" {
  source = "../../modules/storage"
  
  project_name       = local.project_name
  environment        = local.environment
  bucket_name        = local.storage_bucket_name
  max_file_size      = "10MB"
  allowed_mime_types = ["image/jpeg", "image/png", "application/pdf"]
}

# Output staging environment endpoints
output "vercel_deployment_url" {
  description = "URL of the staging Vercel deployment for application access"
  value       = module.vercel.deployment_url
}

output "supabase_api_url" {
  description = "Supabase API URL for staging environment database and auth access"
  value       = module.database.supabase_api_url
}

output "redis_connection_url" {
  description = "Redis connection URL for staging environment cache access"
  value       = module.cache.redis_url
  sensitive   = true
}