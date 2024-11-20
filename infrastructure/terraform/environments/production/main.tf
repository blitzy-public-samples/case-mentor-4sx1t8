# Human Tasks:
# 1. Ensure AWS credentials are configured for S3 backend access
# 2. Verify Vercel API token is set in environment
# 3. Configure Supabase access credentials
# 4. Set up Upstash Redis credentials

# Requirement: Production Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Configure locals for production environment settings
locals {
  environment = "production"
  project_name = "case-interview-platform-prod"
  
  # High-performance database configuration for production
  database_config = {
    instance_size = "db-8cpu-16gb"
    max_connections = 200
    read_replicas = 2
  }
  
  # Production Redis cache settings for optimal performance
  redis_config = {
    instance_size = "cache.t3.large"
    memory_size = "4gb"
    max_connections = 1000
  }
  
  # Storage limits for user uploads
  storage_config = {
    profile_images_size_limit = 5242880     # 5MB
    drill_attachments_size_limit = 10485760  # 10MB
  }
}

# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Configure Terraform backend for state management
terraform {
  backend "s3" {
    bucket = "case-interview-platform-tfstate"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-state-lock"
  }
  
  # Required providers with versions
  required_providers {
    vercel = {
      source = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source = "supabase/supabase"
      version = "~> 1.0"
    }
    upstash = {
      source = "upstash/upstash"
      version = "~> 1.0"
    }
  }
}

# Requirement: Data Security (8.2 DATA SECURITY/8.2.1 Data Classification)
# Production database module configuration
module "database" {
  source = "../../modules/database"
  
  project_name = local.project_name
  environment = local.environment
  instance_size = local.database_config.instance_size
  max_connections = local.database_config.max_connections
  read_replicas = local.database_config.read_replicas
}

# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Production Redis cache configuration
module "cache" {
  source = "../../modules/cache"
  
  project_name = local.project_name
  environment = local.environment
  instance_size = local.redis_config.instance_size
  memory_size = local.redis_config.memory_size
  max_connections = local.redis_config.max_connections
}

# Requirement: Data Security (8.2 DATA SECURITY/8.2.1 Data Classification)
# Production storage configuration
module "storage" {
  source = "../../modules/storage"
  
  project_name = local.project_name
  environment = local.environment
  profile_images_size_limit = local.storage_config.profile_images_size_limit
  drill_attachments_size_limit = local.storage_config.drill_attachments_size_limit
}

# Output production database connection URL
output "database_url" {
  description = "Production database connection URL"
  value       = module.database.connection_url
  sensitive   = true
}

# Output production Redis connection URL
output "redis_url" {
  description = "Production Redis connection URL"
  value       = module.cache.connection_url
  sensitive   = true
}

# Output production storage URL
output "storage_url" {
  description = "Production storage URL"
  value       = module.storage.bucket_url
}