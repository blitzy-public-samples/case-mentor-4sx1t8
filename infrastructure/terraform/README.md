# Case Interview Practice Platform - Infrastructure

This document provides comprehensive documentation for the infrastructure setup and deployment of the Case Interview Practice Platform using Terraform.

## Prerequisites

> **Required Tools & Versions**
- Terraform (~> 1.0)
- Vercel CLI (latest)
- Supabase CLI (latest)
- Upstash Redis CLI (latest)

> **Required Access Credentials**
- Vercel API Token with deployment permissions
- Supabase Access Token and Project Reference
- Upstash Redis API Key and Email

## Project Structure

```
infrastructure/terraform/
├── main.tf                 # Main infrastructure configuration
├── variables.tf            # Variable definitions and validation
├── terraform.tfvars        # Environment-specific variables (gitignored)
├── modules/
│   ├── database/          # Supabase PostgreSQL configuration
│   ├── cache/            # Redis cache configuration
│   └── storage/          # File storage configuration
└── README.md             # This documentation
```

## Module Documentation

### Database Module (Supabase)
- **Purpose**: Manages PostgreSQL database for user data, drill attempts, and analytics
- **Configuration**:
  ```hcl
  module "database" {
    source        = "./modules/database"
    project_name  = local.project_name
    environment   = local.environment
    instance_size = local.database_instance_size
  }
  ```
- **Outputs**:
  - `supabase_api_url`: API endpoint for database access
  - `database_connection_string`: PostgreSQL connection string

### Cache Module (Redis)
- **Purpose**: Handles session management and response caching
- **Configuration**:
  ```hcl
  module "cache" {
    source       = "./modules/cache"
    project_name = local.project_name
    environment  = local.environment
    ttl         = local.redis_ttl
  }
  ```
- **Outputs**:
  - `redis_connection_url`: Redis connection string
  - `redis_endpoint`: Cache endpoint URL

### Storage Module
- **Purpose**: Manages file storage for user uploads and assets
- **Configuration**:
  ```hcl
  module "storage" {
    source      = "./modules/storage"
    project_name = local.project_name
    environment = local.environment
    bucket_name = local.storage_bucket_name
  }
  ```
- **Outputs**:
  - `storage_bucket_url`: Public bucket URL
  - `storage_access_key`: Access credentials

## Environment Configuration

### Development Environment
```hcl
# terraform.tfvars
environment         = "development"
database_instance_size = "db-2cpu-4gb"
redis_instance_size   = "cache.t3.small"
```

### Staging Environment
```hcl
environment         = "staging"
database_instance_size = "db-4cpu-8gb"
redis_instance_size   = "cache.t3.medium"
```

### Production Environment
```hcl
environment         = "production"
database_instance_size = "db-8cpu-16gb"
redis_instance_size   = "cache.t3.large"
```

## Deployment Guide

1. **Initialize Terraform**
   ```bash
   terraform init
   ```

2. **Select Workspace**
   ```bash
   terraform workspace select <environment>
   ```

3. **Configure Environment Variables**
   ```bash
   export TF_VAR_vercel_api_token=<token>
   export TF_VAR_supabase_access_token=<token>
   export TF_VAR_upstash_api_key=<key>
   ```

4. **Plan Deployment**
   ```bash
   terraform plan -out=tfplan
   ```

5. **Apply Configuration**
   ```bash
   terraform apply tfplan
   ```

## Security Considerations

### Sensitive Variable Management
- Store API tokens in secure environment variables
- Use encrypted state storage
- Enable state locking for concurrent access

### Access Control
```hcl
# Example IAM configuration
resource "vercel_project_access" "main" {
  project_id = vercel_project.main.id
  members    = ["team@organization.com"]
  role       = "developer"
}
```

### Encryption Configuration
- Enable at-rest encryption for all storage
- Use TLS for all data in transit
- Implement key rotation policies

## Maintenance

### Routine Tasks
1. Regular state backup
2. Infrastructure version updates
3. Security patch application
4. Performance monitoring

### Monitoring Setup
```hcl
# Example monitoring configuration
resource "vercel_monitoring" "main" {
  project_id = vercel_project.main.id
  alerts     = ["deployment", "error_rate", "latency"]
}
```

### Troubleshooting
- Check Vercel deployment logs
- Verify Supabase connection status
- Monitor Redis cache metrics
- Review infrastructure state

### Backup Procedures
1. Export database snapshots
2. Archive storage buckets
3. Backup Terraform state
4. Document configuration versions

## Resource Specifications

| Resource | Size | Scaling Limits |
|----------|------|----------------|
| Database | Per environment | Auto-scaling enabled |
| Redis Cache | Per environment | Burst capacity: 2x |
| Storage | Pay per use | No fixed limit |
| Edge Functions | Auto-scaling | 1000 concurrent |

## Security Configurations

| Service | Authentication | Encryption |
|---------|----------------|------------|
| Vercel | API Token | TLS 1.3 |
| Supabase | JWT + API Key | AES-256 |
| Redis | Password + TLS | TLS 1.2+ |
| Storage | IAM + Presigned URLs | AES-256 |