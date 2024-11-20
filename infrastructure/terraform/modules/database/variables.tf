# Human Tasks:
# 1. Ensure database password meets organization's security requirements
# 2. Review and adjust backup retention period based on compliance needs
# 3. Determine optimal number of read replicas based on expected load

# Requirement: Database Layer Configuration (5.2 Component Details/Database Layer)
# Project name variable with validation for naming convention compliance
variable "project_name" {
  type        = string
  description = "Name of the Case Interview Practice Platform project"
  default     = "case-interview-platform"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens"
  }
}

# Requirement: Data Storage Requirements (4.3 Databases & Storage)
# Region variable with validation for supported Supabase regions
variable "region" {
  type        = string
  description = "Region for deploying the Supabase PostgreSQL database"

  validation {
    condition     = contains(["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"], var.region)
    error_message = "Region must be one of the supported Supabase regions"
  }
}

# Requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Database instance size variable with validation for correct format
variable "database_instance_size" {
  type        = string
  description = "Size of the Supabase PostgreSQL database instance"
  default     = "db-4cpu-8gb"

  validation {
    condition     = can(regex("^db-[0-9]+cpu-[0-9]+gb$", var.database_instance_size))
    error_message = "Database instance size must follow pattern: db-<cpu>cpu-<memory>gb"
  }
}

# Requirement: Data Storage Requirements (4.3 Databases & Storage)
# Database password variable with security validation
variable "supabase_db_password" {
  type        = string
  description = "Password for Supabase PostgreSQL database"
  sensitive   = true

  validation {
    condition     = length(var.supabase_db_password) >= 16
    error_message = "Database password must be at least 16 characters long"
  }
}

# Requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Backup retention configuration with validation rules
variable "backup_retention_days" {
  type        = number
  description = "Number of days to retain database backups"
  default     = 30

  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 7 and 35 days"
  }
}

# Requirement: Database Layer Configuration (5.2 Component Details/Database Layer)
# Read replicas configuration for horizontal scaling
variable "db_replicas" {
  type        = number
  description = "Number of read replicas for horizontal scaling"
  default     = 2

  validation {
    condition     = var.db_replicas >= 0 && var.db_replicas <= 5
    error_message = "Number of database replicas must be between 0 and 5"
  }
}

# Requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Point-in-time recovery configuration
variable "enable_point_in_time_recovery" {
  type        = bool
  description = "Enable point-in-time recovery for the database"
  default     = true
}

# Requirement: Database Layer Configuration (5.2 Component Details/Database Layer)
# Connection pooling configuration for performance optimization
variable "enable_connection_pooling" {
  type        = bool
  description = "Enable connection pooling for improved performance"
  default     = true
}

# Requirement: Data Storage Requirements (4.3 Databases & Storage)
# Real-time feature configuration
variable "enable_realtime" {
  type        = bool
  description = "Enable real-time subscriptions feature"
  default     = true
}