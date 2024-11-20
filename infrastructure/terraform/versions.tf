# Human Tasks:
# 1. Generate and configure Vercel API token with appropriate permissions
# 2. Set up Supabase project and obtain API credentials
# 3. Create Upstash account and generate API credentials
# 4. Configure environment-specific variables for each provider

# Requirement: Infrastructure Management (5.1 High-Level Architecture)
# Defines required Terraform version for consistent infrastructure provisioning
terraform {
  required_version = "~> 1.5.0"

  # Requirement: Deployment Architecture (5.5 Deployment Architecture)
  # Configures required providers for platform components
  required_providers {
    # Vercel provider for NextJS application hosting and edge function deployment
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }

    # Supabase provider for PostgreSQL database, authentication, and storage management
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }

    # Upstash provider for Redis caching and session management
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
  }
}

# Requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Provider configurations for maintaining 99.9% uptime and platform stability

provider "vercel" {
  # Required: Vercel API token for authentication
  api_token = var.vercel_api_token

  # Optional: Team identifier for organization deployments
  team = var.vercel_team_id

  # Required: Default region for resource deployment
  default_region = var.vercel_default_region
}

provider "supabase" {
  # Required: Supabase project URL
  api_url = var.supabase_api_url

  # Required: Service role key for management operations
  api_key = var.supabase_api_key

  # Required: Database password for root access
  db_password = var.supabase_db_password
}

provider "upstash" {
  # Required: Upstash API key for authentication
  api_key = var.upstash_api_key

  # Required: Account email for API access
  email = var.upstash_email

  # Required: Region for Redis deployment
  region = var.upstash_region
}