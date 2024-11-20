#!/bin/bash

# Human Tasks:
# 1. Ensure PostgreSQL client tools (pg_dump v14) are installed
# 2. Configure AWS CLI v2.x and set up credentials
# 3. Create S3 bucket with appropriate encryption and lifecycle policies
# 4. Set up IAM role with necessary S3 permissions
# 5. Create log directory with appropriate permissions
# 6. Verify database connection credentials are accessible

# Script version
VERSION="1.0.0"

# Import environment variables
# Required by: "5.2 Component Details/Database Layer" - Database connection details
if [ -f "../terraform/modules/database/main.tf" ]; then
    # Extract database connection details from Terraform outputs
    DATABASE_URL=$(terraform output -state=../terraform/modules/database/terraform.tfstate -raw supabase_database_url)
    DATABASE_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
else
    echo "Error: Database configuration not found"
    exit 1
fi

# Global variables
BACKUP_DIR="/var/backup/case-interview-platform"
S3_BUCKET="case-interview-platform-backups"
LOG_FILE="/var/log/case-interview-platform/backup.log"
RETENTION_DAYS=30
MAX_RETRIES=3
DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup-${DATE}.dump"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

# Logging function
# Implements: "8.2 Data Security/Data Classification" - Audit logging requirements
log() {
    local level=$1
    local message=$2
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $message" >> "$LOG_FILE"
    if [ "$level" = "ERROR" ]; then
        # Send error notification via Resend API
        curl -X POST "https://api.resend.com/v1/email" \
             -H "Authorization: Bearer $RESEND_API_KEY" \
             -H "Content-Type: application/json" \
             -d "{\"from\":\"backup@case-interview-platform.com\",\"to\":\"admin@case-interview-platform.com\",\"subject\":\"Backup Error Alert\",\"text\":\"$message\"}"
    fi
}

# Setup backup environment
# Implements: "5.2 Component Details/Database Layer" - Backup infrastructure
setup_backup_environment() {
    # Create backup directory with secure permissions
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    chmod 700 "$(dirname "$LOG_FILE")"
    
    # Validate required environment variables
    local required_vars=("DATABASE_URL" "S3_BUCKET" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log "ERROR" "Required environment variable $var is not set"
            return 1
        fi
    done
    
    # Check required tools
    if ! command -v pg_dump &> /dev/null; then
        log "ERROR" "pg_dump is not installed"
        return 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log "ERROR" "aws-cli is not installed"
        return 1
    fi
    
    # Verify tool versions
    local pg_version=$(pg_dump --version | grep -oP '\d+' | head -1)
    if [ "$pg_version" != "14" ]; then
        log "ERROR" "Incorrect pg_dump version. Required: 14, Found: $pg_version"
        return 1
    fi
    
    local aws_version=$(aws --version | grep -oP '2\.\d+\.\d+' | head -1)
    if [[ ! $aws_version =~ ^2\. ]]; then
        log "ERROR" "Incorrect aws-cli version. Required: 2.x, Found: $aws_version"
        return 1
    }
    
    # Initialize log file for new backup session
    log "INFO" "Starting backup process v${VERSION}"
    return 0
}

# Perform database backup
# Implements: "5.2 Component Details/Database Layer" - Daily snapshots
perform_database_backup() {
    local backup_timestamp=$1
    
    log "INFO" "Starting database backup at $backup_timestamp"
    
    # Execute pg_dump with consistent snapshot and compression
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h "$DATABASE_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F c \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --snapshot \
        -f "$BACKUP_FILE"
    
    if [ $? -ne 0 ]; then
        log "ERROR" "Database backup failed"
        return 1
    fi
    
    # Set secure file permissions
    chmod 600 "$BACKUP_FILE"
    
    # Generate SHA256 checksum
    sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
    
    # Log backup details
    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "INFO" "Backup completed successfully. Size: $backup_size"
    
    echo "$BACKUP_FILE"
    return 0
}

# Upload backup to S3
# Implements: "8.2 Data Security/Data Classification" - Secure backup storage
upload_to_s3() {
    local backup_file=$1
    local retry_count=0
    local max_retries=$MAX_RETRIES
    
    while [ $retry_count -lt $max_retries ]; do
        log "INFO" "Attempting S3 upload (attempt $((retry_count + 1)))"
        
        # Upload with server-side encryption
        aws s3 cp "$backup_file" "s3://${S3_BUCKET}/$(basename "$backup_file")" \
            --sse AES256 \
            --only-show-errors
        
        if [ $? -eq 0 ]; then
            # Verify upload with checksum comparison
            local local_checksum=$(cat "${backup_file}.sha256" | cut -d' ' -f1)
            local s3_checksum=$(aws s3api head-object \
                --bucket "$S3_BUCKET" \
                --key "$(basename "$backup_file")" \
                --query 'Metadata.sha256' \
                --output text)
            
            if [ "$local_checksum" = "$s3_checksum" ]; then
                log "INFO" "Backup successfully uploaded to S3"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            sleep $((2 ** retry_count))  # Exponential backoff
        fi
    done
    
    log "ERROR" "Failed to upload backup to S3 after $max_retries attempts"
    return 1
}

# Cleanup old backups
# Implements: "5.2 Component Details/Database Layer" - Retention policy
cleanup_old_backups() {
    local retention_days=$1
    local cleaned_count=0
    
    # Clean local backups
    log "INFO" "Cleaning up local backups older than $retention_days days"
    
    find "$BACKUP_DIR" -type f -name "backup-*.dump" -mtime +$retention_days -exec rm -f {} \;
    cleaned_count=$?
    
    # Clean S3 backups (using lifecycle rules)
    aws s3api list-objects-v2 \
        --bucket "$S3_BUCKET" \
        --query "Contents[?LastModified<=\`$(date -d "-$retention_days days" -Iseconds)\`].Key" \
        --output text | \
    while read -r key; do
        if [ ! -z "$key" ]; then
            aws s3 rm "s3://${S3_BUCKET}/${key}"
            cleaned_count=$((cleaned_count + 1))
        fi
    done
    
    # Ensure at least one backup remains
    local remaining_count=$(find "$BACKUP_DIR" -type f -name "backup-*.dump" | wc -l)
    if [ $remaining_count -eq 0 ]; then
        log "ERROR" "No backups remaining after cleanup"
        return 1
    fi
    
    log "INFO" "Cleaned up $cleaned_count old backup files"
    return 0
}

# Main backup function
# Implements: "5.2 Component Details/Database Layer" - Automated backup process
backup_database() {
    # Setup environment
    setup_backup_environment
    if [ $? -ne 0 ]; then
        log "ERROR" "Environment setup failed"
        exit 1
    fi
    
    # Perform backup
    local backup_file=$(perform_database_backup "$DATE")
    if [ $? -ne 0 ]; then
        log "ERROR" "Backup creation failed"
        exit 2
    fi
    
    # Upload to S3
    upload_to_s3 "$backup_file"
    if [ $? -ne 0 ]; then
        log "ERROR" "S3 upload failed"
        exit 3
    fi
    
    # Cleanup old backups
    cleanup_old_backups "$RETENTION_DAYS"
    if [ $? -ne 0 ]; then
        log "ERROR" "Backup cleanup failed"
        exit 4
    fi
    
    log "INFO" "Backup process completed successfully"
    exit 0
}

# Execute main function
backup_database