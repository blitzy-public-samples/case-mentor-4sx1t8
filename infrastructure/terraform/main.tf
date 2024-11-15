# Human Tasks:
# 1. Ensure Vercel API token is configured in environment
# 2. Configure Supabase access credentials
# 3. Set up Upstash Redis credentials
# 4. Review and adjust resource sizing for each environment

# Requirement: Infrastructure as Code (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Define local variables for resource configuration
locals {
  project_name = "case-interview-platform"
  environment = terraform.workspace
  database_instance_size = "db-4cpu-8gb"
  redis_instance_size = "cache.t3.medium"
  redis_ttl = "3600"
  storage_bucket_name = "case-interview-assets"
  common_tags = {
    Project     = "Case Interview Platform"
    Environment = terraform.workspace
    ManagedBy   = "Terraform"
  }
}

# Requirement: Cloud Services Integration (4.2 FRAMEWORKS & LIBRARIES/Supporting Libraries)
# Database module for Supabase PostgreSQL provisioning
module "database" {
  source = "./modules/database"
  
  project_name    = local.project_name
  environment     = local.environment
  instance_size   = local.database_instance_size
  max_connections = 100

  tags = local.common_tags
}

# Redis cache module for session and data caching
module "cache" {
  source = "./modules/cache"
  
  project_name   = local.project_name
  environment    = local.environment
  instance_size  = local.redis_instance_size
  ttl           = local.redis_ttl

  tags = local.common_tags
}

# Storage module for file uploads and assets
module "storage" {
  source = "./modules/storage"
  
  project_name = local.project_name
  environment  = local.environment
  bucket_name  = local.storage_bucket_name

  tags = local.common_tags
}

# Requirement: Deployment Environment (9.1 DEPLOYMENT ENVIRONMENT)
# Vercel project configuration for NextJS application hosting
resource "vercel_project" "main" {
  name      = local.project_name
  framework = "nextjs"
  
  environment = [
    {
      key   = "NEXT_PUBLIC_SUPABASE_URL"
      value = module.database.supabase_api_url
    },
    {
      key   = "NEXT_PUBLIC_REDIS_URL"
      value = module.cache.redis_url
    }
  ]

  git_repository = {
    type = "github"
    repo = "organization/case-interview-platform"
  }

  build_command = "npm run build"
  output_directory = ".next"
  
  tags = local.common_tags
}

# Data source for current workspace information
data "terraform_workspace" "current" {}

# Output Vercel deployment URL
output "vercel_deployment_url" {
  description = "The URL of the Vercel deployment"
  value       = vercel_project.main.deployment_url
}

# Output Supabase API URL
output "supabase_api_url" {
  description = "The Supabase API URL for database and auth access"
  value       = module.database.supabase_api_url
}

# Output Redis connection URL (marked as sensitive)
output "redis_connection_url" {
  description = "The Redis connection URL for cache access"
  value       = module.cache.redis_url
  sensitive   = true
}