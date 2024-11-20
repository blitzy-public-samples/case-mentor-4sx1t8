# Human Tasks:
# 1. Generate Vercel API token with appropriate project and deployment permissions
# 2. Create Supabase project and obtain access token and project reference
# 3. Set up Upstash account and generate API credentials
# 4. Configure environment-specific variables in terraform.tfvars

# Requirement: Infrastructure Configuration (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Project configuration variables
variable "project_name" {
  type        = string
  description = "Name of the Case Interview Practice Platform project"
  default     = "case-interview-platform"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens"
  }
}

# Requirement: Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT)
variable "environment" {
  type        = string
  description = "Deployment environment (development, staging, production)"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

# Requirement: Security Configuration (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
# Vercel authentication variables
variable "vercel_api_token" {
  type        = string
  description = "API token for Vercel platform access, required by vercel provider (~> 1.0)"
  sensitive   = true
}

variable "vercel_team_id" {
  type        = string
  description = "Team ID for Vercel project deployment, required for organization deployments"
  sensitive   = true
}

# Supabase authentication variables
variable "supabase_access_token" {
  type        = string
  description = "Access token for Supabase service management, required by supabase provider (~> 1.0)"
  sensitive   = true
}

variable "supabase_project_ref" {
  type        = string
  description = "Project reference ID for Supabase project, used for resource identification"
  sensitive   = true
}

variable "supabase_db_password" {
  type        = string
  description = "Password for Supabase PostgreSQL database root access"
  sensitive   = true
}

# Upstash authentication variables
variable "upstash_api_key" {
  type        = string
  description = "API key for Upstash Redis service management, required by upstash provider (~> 1.0)"
  sensitive   = true
}

variable "upstash_email" {
  type        = string
  description = "Email address associated with Upstash account for API authentication"
  sensitive   = true
}

# Infrastructure sizing variables
variable "database_instance_size" {
  type        = string
  description = "Size of the Supabase PostgreSQL database instance"
  default     = "db-4cpu-8gb"

  validation {
    condition     = can(regex("^db-[0-9]+cpu-[0-9]+gb$", var.database_instance_size))
    error_message = "Database instance size must follow pattern: db-<cpu>cpu-<memory>gb"
  }
}

variable "redis_instance_size" {
  type        = string
  description = "Size of the Redis cache instance following AWS node type patterns"
  default     = "cache.t3.medium"

  validation {
    condition     = can(regex("^cache\\.[a-z0-9]+\\.[a-z]+$", var.redis_instance_size))
    error_message = "Redis instance size must follow AWS cache node type pattern"
  }
}

variable "redis_ttl" {
  type        = number
  description = "Default TTL for Redis cache entries in seconds"
  default     = 3600

  validation {
    condition     = var.redis_ttl >= 0 && var.redis_ttl <= 86400
    error_message = "Redis TTL must be between 0 and 86400 seconds (24 hours)"
  }
}

variable "storage_bucket_name" {
  type        = string
  description = "Name of the Supabase storage bucket for assets"
  default     = "case-interview-assets"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.storage_bucket_name))
    error_message = "Storage bucket name must contain only lowercase letters, numbers, and hyphens"
  }
}