# Terraform AWS provider version ~> 1.0

# Human Tasks:
# 1. Ensure Vercel account has been set up with appropriate access tokens
# 2. Configure DNS records for custom domain if specified
# 3. Verify SSL certificate if custom domain is used

# Requirement: Global Content Delivery (5.1 High-Level Architecture)
# Configures project name and environment for Vercel Edge Network deployment
variable "project_name" {
  type        = string
  description = "Name of the Vercel project for the Case Interview Practice Platform"
  
  validation {
    condition     = length(var.project_name) > 0 && can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must be non-empty and contain only lowercase letters, numbers, and hyphens"
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment (production, staging) for the Vercel project"
  
  validation {
    condition     = contains(["production", "staging"], var.environment)
    error_message = "Environment must be either production or staging"
  }
}

# Requirement: Edge Network Distribution (9.1 DEPLOYMENT ENVIRONMENT)
# Defines geographic distribution across global edge locations
variable "cdn_regions" {
  type        = list(string)
  description = "List of Vercel Edge Network regions to deploy to (iad1=North America, sfo1=North America West, hnd1=Asia, bru1=Europe)"
  default     = ["iad1", "sfo1", "hnd1", "bru1"]
  
  validation {
    condition     = length(var.cdn_regions) > 0 && alltrue([for r in var.cdn_regions : contains(["iad1", "sfo1", "hnd1", "bru1"], r)])
    error_message = "At least one valid CDN region (iad1, sfo1, hnd1, bru1) must be specified"
  }
}

# Requirement: Static Asset Optimization (4.3 DATABASES & STORAGE/CDN)
# Configures caching parameters for static content delivery
variable "static_cache_duration" {
  type        = number
  description = "Cache duration in seconds for static assets (default 1 hour)"
  default     = 3600
  
  validation {
    condition     = var.static_cache_duration >= 0 && var.static_cache_duration <= 31536000
    error_message = "Cache duration must be between 0 and 31536000 seconds (1 year)"
  }
}

variable "api_cache_duration" {
  type        = number
  description = "Cache duration in seconds for API responses (default 0 for no caching)"
  default     = 0
  
  validation {
    condition     = var.api_cache_duration >= 0 && var.api_cache_duration <= 300
    error_message = "API cache duration must be between 0 and 300 seconds (5 minutes)"
  }
}

# Optional custom domain configuration
variable "custom_domain" {
  type        = string
  description = "Optional custom domain for the CDN endpoint (must be a valid domain name)"
  default     = null
  
  validation {
    condition     = var.custom_domain == null || can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$", var.custom_domain))
    error_message = "Custom domain must be a valid domain name"
  }
}

variable "ssl_enabled" {
  type        = bool
  description = "Whether SSL/TLS is enabled for the custom domain (required for production)"
  default     = true
}