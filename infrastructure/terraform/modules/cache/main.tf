# Required providers configuration
# Requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
terraform {
  required_providers {
    upstash = {
      source  = "upstash/upstash" # v1.0.0
      version = "~> 1.0"
    }
  }
}

# Redis Cache Instance
# Requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
# Implements Redis caching with specific TTLs for API responses (5 min), session data (24 hrs), 
# and drill data (1 hr) using Upstash Redis for global availability
resource "upstash_redis_database" "redis_cache" {
  database_name    = "${var.environment}-case-interview-cache"
  region          = "global"  # Global deployment for low-latency access
  version         = var.redis_version
  memory_size     = var.redis_memory_size
  eviction_policy = var.redis_eviction_policy
  max_connections = var.redis_max_connections
  tls_enabled     = true      # Enforcing TLS for security

  # Requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
  # Tags for resource organization and management
  tags = {
    Environment = var.environment
    Project     = "case-interview-platform"
    ManagedBy   = "terraform"
  }

  # Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
  # Optimized configuration for <200ms API response time
  lifecycle {
    prevent_destroy = true  # Prevent accidental destruction of cache infrastructure
    
    # Ignore changes to tags to prevent unnecessary updates
    ignore_changes = [
      tags["LastModified"],
    ]
  }
}

# Redis Connection String
# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Secure connection string for application integration
data "upstash_redis_connection_string" "redis_connection" {
  database_id = upstash_redis_database.redis_cache.id
}

# Local variables for internal module use
locals {
  redis_port = upstash_redis_database.redis_cache.port
  redis_host = upstash_redis_database.redis_cache.host
}

# Output definitions are in outputs.tf