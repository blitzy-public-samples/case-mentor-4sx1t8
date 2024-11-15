# Requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
# Exposes Redis cache connection details for API response caching, session management,
# and drill data storage with global availability support

# Redis host output for global access configuration
# Requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
output "redis_host" {
  description = "Redis cache instance hostname for global access"
  value       = upstash_redis_database.redis_cache.host
}

# Redis port output for connection configuration
# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
output "redis_port" {
  description = "Redis cache instance port number for connection configuration"
  value       = upstash_redis_database.redis_cache.port
}

# Secure Redis connection string including authentication credentials
# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
output "redis_connection_string" {
  description = "Full Redis connection string including authentication credentials for secure application configuration"
  value       = data.upstash_redis_connection_string.redis_connection.uri
  sensitive   = true  # Marked as sensitive to prevent exposure in logs and output
}

# Redis cache instance identifier
# Requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
output "redis_cache_id" {
  description = "Unique identifier of the Redis cache instance for resource tracking and reference"
  value       = upstash_redis_database.redis_cache.id
}