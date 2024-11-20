# Requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
# Defines variables for Redis cache configuration to support platform performance requirements

variable "environment" {
  type        = string
  description = "Deployment environment (development, staging, production) for the Redis cache instance"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

variable "redis_version" {
  type        = string
  description = "Redis version to use for the cache instance, must be compatible with Upstash provider"
  default     = "6.2"

  validation {
    condition     = can(regex("^[0-9]+(\\.[0-9]+)*$", var.redis_version))
    error_message = "Redis version must be a valid semantic version number"
  }
}

# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Configures memory size to support <200ms API response time for 95% of requests
variable "redis_memory_size" {
  type        = number
  description = "Memory size in MB for the Redis cache instance, scaled based on environment and load requirements"
  default     = 2048

  validation {
    condition     = var.redis_memory_size >= 512 && var.redis_memory_size <= 8192
    error_message = "Redis memory size must be between 512MB and 8192MB to maintain performance"
  }
}

variable "redis_eviction_policy" {
  type        = string
  description = "Eviction policy for Redis cache when memory limit is reached, optimized for the platform's caching patterns"
  default     = "volatile-lru"

  validation {
    condition     = contains(["noeviction", "allkeys-lru", "volatile-lru", "allkeys-random", "volatile-random", "volatile-ttl"], var.redis_eviction_policy)
    error_message = "Invalid Redis eviction policy specified"
  }
}

variable "redis_max_connections" {
  type        = number
  description = "Maximum number of concurrent connections to Redis cache, scaled based on expected platform load"
  default     = 100

  validation {
    condition     = var.redis_max_connections >= 10 && var.redis_max_connections <= 1000
    error_message = "Redis max connections must be between 10 and 1000 to prevent overload"
  }
}

# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Configures cache TTLs to optimize API response times and data freshness
variable "api_cache_ttl" {
  type        = number
  description = "TTL in seconds for API response cache entries, optimized for data freshness and performance"
  default     = 300

  validation {
    condition     = var.api_cache_ttl >= 60 && var.api_cache_ttl <= 3600
    error_message = "API cache TTL must be between 60 and 3600 seconds for optimal performance"
  }
}

variable "session_cache_ttl" {
  type        = number
  description = "TTL in seconds for session data cache entries, aligned with platform security requirements"
  default     = 86400

  validation {
    condition     = var.session_cache_ttl >= 3600 && var.session_cache_ttl <= 604800
    error_message = "Session cache TTL must be between 1 hour and 7 days for security compliance"
  }
}

variable "drill_cache_ttl" {
  type        = number
  description = "TTL in seconds for drill data cache entries, balanced for data persistence and memory usage"
  default     = 3600

  validation {
    condition     = var.drill_cache_ttl >= 300 && var.drill_cache_ttl <= 86400
    error_message = "Drill cache TTL must be between 5 minutes and 24 hours for optimal performance"
  }
}

# Requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Configures backup and maintenance settings to ensure 99.9% uptime
variable "redis_backup_frequency" {
  type        = string
  description = "Frequency of Redis cache backups (hourly, daily, weekly)"
  default     = "daily"

  validation {
    condition     = contains(["hourly", "daily", "weekly"], var.redis_backup_frequency)
    error_message = "Backup frequency must be one of: hourly, daily, weekly"
  }
}

variable "redis_maintenance_window" {
  type        = string
  description = "Preferred maintenance window for Redis cache updates in UTC (format: ddd:hh:mm-ddd:hh:mm)"
  default     = "sun:03:00-sun:04:00"

  validation {
    condition     = can(regex("^(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]-(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]$", var.redis_maintenance_window))
    error_message = "Maintenance window must be in format ddd:hh:mm-ddd:hh:mm"
  }
}