# Requirement: Staging Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Project and environment identification
project_name = "case-interview-platform-staging"
environment  = "staging"

# Requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
# Resource sizing for staging environment - reduced capacity compared to production
database_instance_size = "db-2cpu-4gb"
redis_instance_size   = "cache.t3.small"
redis_ttl            = 3600

# Storage configuration for staging assets
storage_bucket_name = "case-interview-assets-staging"

# Requirement: Security Configuration (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
# Sensitive credentials for service access - values to be provided securely
# Note: Replace <sensitive> placeholders with actual values using secure methods
vercel_api_token       = "<sensitive>"
vercel_team_id        = "<sensitive>"
supabase_access_token = "<sensitive>"
supabase_project_ref  = "<sensitive>"
supabase_db_password  = "<sensitive>"
upstash_api_key      = "<sensitive>"
upstash_email        = "<sensitive>"