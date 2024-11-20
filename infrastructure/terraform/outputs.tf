# Requirement: System Architecture Integration (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Exposes core platform service integration points with secure credential management

# Application deployment URL for public access
output "deployment_url" {
  description = "The URL where the application is deployed on Vercel"
  value       = vercel_project.deployment_url
  sensitive   = false
}

# Requirement: Deployment Environment (9.1 DEPLOYMENT ENVIRONMENT)
# Supabase API endpoint for database and authentication access
output "supabase_api_url" {
  description = "The Supabase project API endpoint URL for database and auth access"
  value       = module.database.supabase_api_url
  sensitive   = false
}

# Secure database connection URL with credentials
output "supabase_database_url" {
  description = "The PostgreSQL database connection URL with secure credentials"
  value       = module.database.database_url
  sensitive   = true  # Protected to prevent credential exposure
}

# Redis connection URL with authentication details
output "redis_connection_url" {
  description = "The Redis cache connection URL with secure authentication"
  value       = module.cache.redis_connection_string
  sensitive   = true  # Protected to prevent credential exposure
}

# Redis host information for connection configuration
output "redis_host" {
  description = "The Redis cache instance hostname for connection configuration"
  value       = module.cache.redis_host
  sensitive   = false
}