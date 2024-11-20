# Human Tasks:
# 1. Ensure Vercel account credentials are configured in provider authentication
# 2. Verify project permissions and access tokens
# 3. If using custom domain, prepare DNS records for domain verification
# 4. Monitor initial deployment for successful edge network distribution

# Provider configuration
# Vercel Provider v0.15.0
terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15.0"
    }
  }
}

# Requirement: Global Content Delivery (5.1 High-Level Architecture)
# Configures Vercel project for global edge network deployment
resource "vercel_project" "main" {
  name           = var.project_name
  framework      = "nextjs"
  root_directory = "src/web"
  build_command  = "npm run build"
  output_directory = ".next"
  
  # Requirement: CDN Performance (2. SYSTEM OVERVIEW/Success Criteria)
  # Configure edge regions for <200ms response time target
  regions = var.cdn_regions
  
  environment = [
    {
      key    = "ENVIRONMENT"
      value  = var.environment
      target = [var.environment]
    }
  ]
}

# Requirement: Static Asset Optimization (4.3 DATABASES & STORAGE/CDN)
# Configure deployment with cache control headers for static and API routes
resource "vercel_deployment" "main" {
  project_id = vercel_project.main.id
  production = var.environment == "production"

  # Configure caching rules for different content types
  routes = [
    {
      src     = "/api/(.*)"
      dest    = "/api/$1"
      headers = {
        "Cache-Control" = "s-maxage=${var.api_cache_duration}"
      }
    },
    {
      src     = "/(.*)"
      dest    = "/$1"
      headers = {
        "Cache-Control" = "s-maxage=${var.static_cache_duration}"
      }
    }
  ]

  # Ensure proper build and deployment settings
  git {
    deploy_hook_url = true
    provider        = "github"
  }
}

# Custom domain configuration with conditional creation
resource "vercel_domain" "custom" {
  count      = var.custom_domain != null ? 1 : 0
  project_id = vercel_project.main.id
  name       = var.custom_domain
  
  # SSL configuration based on environment requirements
  git {
    ssl_enabled = var.ssl_enabled
  }

  # Ensure domain is configured before deployment
  depends_on = [
    vercel_project.main
  ]
}