# Requirement: Global Content Delivery (5.1 High-Level Architecture)
# Exposes Vercel Edge Network configuration details for global content delivery monitoring
output "project_id" {
  description = "The unique identifier of the created Vercel project used for API integrations and resource references"
  value       = vercel_project.main.id
  sensitive   = false
}

output "project_name" {
  description = "The name of the Vercel project used for human-readable identification and monitoring"
  value       = vercel_project.main.name
  sensitive   = false
}

# Requirement: CDN Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Exposes CDN endpoint information for monitoring <200ms API response time
output "cdn_domain" {
  description = "The primary CDN domain endpoint for content delivery (uses custom domain if configured, otherwise falls back to Vercel's default domain)"
  value       = length(vercel_domain.custom) > 0 ? vercel_domain.custom[0].name : "${vercel_project.main.name}.vercel.app"
  sensitive   = false
}