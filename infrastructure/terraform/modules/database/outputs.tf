# Implements requirements from "4.3 Databases & Storage" and "5.2 Component Details/Database Layer"
# Exposes secure database connection details and resource identifiers for application configuration

output "database_id" {
  description = "Unique identifier of the Supabase PostgreSQL database project for the Case Interview Practice Platform"
  value       = supabase_project.main.id
  sensitive   = false
}

# Implements "System Performance" requirement by exposing connection URL with pooling enabled
output "database_url" {
  description = "Secure PostgreSQL connection URL with connection pooling enabled for optimal performance"
  value       = supabase_project.main.database_url
  sensitive   = true # Marked sensitive to prevent exposure in logs
}

output "api_url" {
  description = "Supabase API URL for secure database access with real-time capabilities"
  value       = supabase_project.main.api_url
  sensitive   = false
}