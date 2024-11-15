# REQ: File Storage Infrastructure (4.3 DATABASES & STORAGE/File Storage)
# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
output "profile_images_bucket_id" {
  description = "ID of the storage bucket for profile images with Confidential data classification"
  value       = supabase_storage_bucket.profile_images.id
  sensitive   = false
}

# REQ: File Storage Infrastructure (4.3 DATABASES & STORAGE/File Storage)
# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
output "drill_attachments_bucket_id" {
  description = "ID of the storage bucket for drill attachments with Internal data classification"
  value       = supabase_storage_bucket.drill_attachments.id
  sensitive   = false
}

# REQ: File Storage Infrastructure (4.3 DATABASES & STORAGE/File Storage)
output "storage_url" {
  description = "Base URL for Supabase storage service used for file access"
  value       = data.supabase_project.this.storage_url
  sensitive   = false
}