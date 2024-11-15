# Human Tasks:
# 1. Verify Supabase project exists and project ID is correctly configured
# 2. Ensure CORS origins are properly configured for production domains
# 3. Monitor storage performance metrics after deployment to validate <200ms response time target
# 4. Review security policies align with organizational data classification requirements

# Required Provider Versions
terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# Import variables from variables.tf
variable "project_id" {}
variable "environment" {}
variable "profile_images_size_limit" {}
variable "drill_attachments_size_limit" {}
variable "storage_access_roles" {}
variable "bucket_versioning_enabled" {}
variable "max_versions_per_file" {}
variable "allowed_mime_types" {}

# REQ: File Storage Infrastructure (4.3 DATABASES & STORAGE/File Storage)
# Retrieve Supabase project information
data "supabase_project" "this" {
  project_id = var.project_id
}

# REQ: File Storage Infrastructure, Data Security Controls
# Storage bucket for profile images with strict security controls
resource "supabase_storage_bucket" "profile_images" {
  name                  = "profile-images-${var.environment}"
  project_id           = var.project_id
  public               = false
  file_size_limit      = var.profile_images_size_limit
  allowed_mime_types   = ["image/jpeg", "image/png", "image/gif"]
  versioning_enabled   = var.bucket_versioning_enabled
  max_versions_per_file = var.max_versions_per_file

  # REQ: Storage Performance
  # Configure caching for optimal performance
  cache_control = "max-age=3600"

  # Configure CORS for secure access
  cors_rules {
    allowed_origins    = ["*"]  # Should be restricted in production
    allowed_methods    = ["GET", "POST", "PUT", "DELETE"]
    allowed_headers    = ["*"]
    max_age_seconds   = 3600
  }
}

# REQ: File Storage Infrastructure, Data Security Controls
# Storage bucket for drill attachments with controlled access
resource "supabase_storage_bucket" "drill_attachments" {
  name                  = "drill-attachments-${var.environment}"
  project_id           = var.project_id
  public               = false
  file_size_limit      = var.drill_attachments_size_limit
  allowed_mime_types   = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]
  versioning_enabled   = var.bucket_versioning_enabled
  max_versions_per_file = var.max_versions_per_file

  # REQ: Storage Performance
  # Configure caching for optimal performance
  cache_control = "max-age=3600"

  # Configure CORS for read-only access
  cors_rules {
    allowed_origins    = ["*"]  # Should be restricted in production
    allowed_methods    = ["GET"]
    allowed_headers    = ["*"]
    max_age_seconds   = 3600
  }
}

# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Access policy for profile images - Confidential classification
resource "supabase_storage_policy" "profile_images" {
  bucket_id          = supabase_storage_bucket.profile_images.id
  roles              = var.storage_access_roles
  allowed_operations = ["SELECT", "INSERT", "UPDATE", "DELETE"]
  owner_only         = true
  definition         = "auth.uid() = owner"
  check_conditions   = "file_size <= ${var.profile_images_size_limit} AND mime_type = ANY(${jsonencode(var.allowed_mime_types)})"
}

# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Access policy for drill attachments - Internal classification
resource "supabase_storage_policy" "drill_attachments" {
  bucket_id          = supabase_storage_bucket.drill_attachments.id
  roles              = var.storage_access_roles
  allowed_operations = ["SELECT"]
  owner_only         = false
  definition         = "auth.role() = 'authenticated'"
  check_conditions   = "file_size <= ${var.drill_attachments_size_limit} AND mime_type = ANY(${jsonencode(var.allowed_mime_types)})"
}