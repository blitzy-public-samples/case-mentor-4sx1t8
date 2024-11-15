# Human Tasks:
# 1. Generate and securely store the Supabase database password
# 2. Configure AWS credentials for backup access
# 3. Verify selected AWS region supports all required services
# 4. Ensure proper IAM roles and permissions are set up for AWS Backup

# Required Provider Configuration
# Implements requirements from "5.2 Component Details/Database Layer"
terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase" # v1.0
      version = "~> 1.0"
    }
    aws = {
      source  = "hashicorp/aws" # v5.0
      version = "~> 5.0"
    }
  }
}

# Input Variables with Validation
variable "project_name" {
  description = "Name of the Supabase project"
  type        = string
  validation {
    condition     = length(var.project_name) > 0 && length(var.project_name) <= 50
    error_message = "Project name must be between 1 and 50 characters"
  }
}

variable "supabase_db_password" {
  description = "Password for the Supabase database"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.supabase_db_password) >= 16
    error_message = "Database password must be at least 16 characters long"
  }
}

variable "region" {
  description = "AWS region for the Supabase project"
  type        = string
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d$", var.region))
    error_message = "Region must be a valid AWS region identifier"
  }
}

variable "database_instance_size" {
  description = "Size/tier of the database instance"
  type        = string
  validation {
    condition     = contains(["free", "small", "medium", "large"], var.database_instance_size)
    error_message = "Database instance size must be one of: free, small, medium, large"
  }
}

# Supabase Project Resource
# Implements "4.3 Databases & Storage" requirements for PostgreSQL configuration
resource "supabase_project" "main" {
  name              = var.project_name
  database_password = var.supabase_db_password
  region            = var.region
  pricing_tier      = var.database_instance_size

  # Configure horizontal scaling with read replicas
  db_replicas = 2

  # Configure automated backup settings
  backup_schedule = {
    enabled            = true
    retention_days     = 30
    schedule_expression = "cron(0 0 * * ? *)" # Daily backups at midnight
  }

  # Database configuration settings
  settings = {
    postgres_version       = "14"
    point_in_time_recovery = true  # Enable point-in-time recovery
    connection_pooling     = true  # Enable connection pooling for better performance
    realtime_enabled      = true  # Enable real-time capabilities
    direct_user_access    = false # Disable direct user access for security
    db_ssl_enforcement    = true  # Enforce SSL connections
  }
}

# AWS Backup Plan for Additional Database Protection
# Implements additional backup requirements from "5.2 Component Details/Database Layer"
resource "aws_backup_plan" "supabase_database_backup" {
  name = "${var.project_name}-backup"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = "Default"
    schedule          = "cron(0 5 ? * * *)" # Daily backups at 5 AM
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 30 # 30-day retention policy
    }
  }
}

# Output Values
output "supabase_project_id" {
  description = "The ID of the created Supabase project"
  value       = supabase_project.main.id
}

output "supabase_database_url" {
  description = "The database connection URL"
  value       = supabase_project.main.database_url
  sensitive   = true
}

output "supabase_api_url" {
  description = "The API URL for the Supabase project"
  value       = supabase_project.main.api_url
}