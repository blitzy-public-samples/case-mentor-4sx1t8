# Requirement: Production Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Core project configuration for production environment
project_name = "case-interview-platform-prod"
environment  = "production"

# Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# High-performance database instance configuration for production workloads
# Sized to handle concurrent connections and maintain <200ms response time
database_instance_size = "db-8cpu-16gb"

# Production-grade Redis cache configuration for optimal performance
# Sized for high throughput and memory capacity
redis_instance_size = "cache.t3.large"
redis_ttl = 3600

# Requirement: Data Security (8.2 DATA SECURITY/8.2.1 Data Classification)
# Production storage bucket configuration with secure naming
storage_bucket_name = "case-interview-assets-prod"