# Human Tasks:
# 1. Configure Terraform Cloud workspace with appropriate organization and workspace settings
# 2. Ensure all provider authentication variables are securely stored in Terraform Cloud workspace
# 3. Verify provider version compatibility with versions.tf requirements
# 4. Set up environment-specific workspaces with appropriate variable values

# Requirement: Cloud Infrastructure (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Configures Terraform backend for state management and provider configurations
terraform {
  # Configure remote backend in Terraform Cloud for state management
  backend "remote" {
    organization = "case-interview-platform"

    workspaces {
      prefix = "case-interview-"
    }
  }
}

# Requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Provider configurations to maintain 99.9% uptime through reliable cloud services

# Vercel provider configuration for NextJS hosting
# Provider version: ~> 1.0
provider "vercel" {
  # Required: API token for authentication
  api_token = var.vercel_api_token
  # Optional: Team ID for organization-level deployments
  team = var.vercel_team_id
}

# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Provider configurations to ensure <200ms API response time

# Supabase provider configuration for database services
# Provider version: ~> 1.0
provider "supabase" {
  # Required: Access token for service management
  access_token = var.supabase_access_token
  # Required: Project reference ID
  project_ref = var.supabase_project_ref
  # Required: Database password for root access
  db_password = var.supabase_db_password
}

# Upstash provider configuration for Redis caching
# Provider version: ~> 1.0
provider "upstash" {
  # Required: API key for service management
  api_key = var.upstash_api_key
  # Required: Account email for authentication
  email = var.upstash_email
}