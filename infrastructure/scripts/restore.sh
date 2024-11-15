#!/bin/bash

# Human Tasks:
# 1. Ensure AWS credentials are configured with appropriate S3 access permissions
# 2. Verify Supabase project credentials are available in environment
# 3. Configure Resend API key for email notifications
# 4. Set up PostgreSQL client tools (version 14)
# 5. Create required directories with appropriate permissions

# Required tool versions:
# - postgresql-client v14
# - aws-cli v2.x
# - resend-cli v1.x

# Global variables
RESTORE_DIR="/var/restore/case-interview-platform"
S3_BUCKET="case-interview-platform-backups"
LOG_FILE="/var/log/case-interview-platform/restore.log"
MAX_RETRIES=3
BACKUP_RETENTION_DAYS=30

# Implements "5.2 Component Details/Database Layer" requirement for database recovery
setup_restore_environment() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Setting up restore environment" >> "$LOG_FILE"
    
    # Create restore directory if not exists
    if [ ! -d "$RESTORE_DIR" ]; then
        mkdir -p "$RESTORE_DIR"
        if [ $? -ne 0 ]; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Failed to create restore directory" >> "$LOG_FILE"
            return 1
        fi
    fi
    
    # Validate required environment variables
    for var in "SUPABASE_PROJECT_ID" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "RESEND_API_KEY"; do
        if [ -z "${!var}" ]; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Required environment variable $var is not set" >> "$LOG_FILE"
            return 1
        fi
    done
    
    # Check for required tools
    for tool in "pg_restore" "aws" "resend"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Required tool $tool is not installed" >> "$LOG_FILE"
            return 1
        fi
    done
    
    # Initialize log file with session ID
    RESTORE_SESSION_ID=$(uuidgen)
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Starting restore session: $RESTORE_SESSION_ID" >> "$LOG_FILE"
    
    # Verify IAM role permissions
    aws s3 ls "s3://$S3_BUCKET" &> /dev/null
    if [ $? -ne 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Failed to access S3 bucket" >> "$LOG_FILE"
        return 1
    fi
    
    return 0
}

# Implements "8.2 Data Security/Data Classification" requirement for secure data handling
download_from_s3() {
    local backup_timestamp="$1"
    local backup_file="$RESTORE_DIR/backup_${backup_timestamp}.dump"
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Downloading backup from S3: $backup_timestamp" >> "$LOG_FILE"
    
    # Validate backup timestamp format (YYYY-MM-DD-HHMMSS)
    if ! [[ $backup_timestamp =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}$ ]]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Invalid backup timestamp format" >> "$LOG_FILE"
        return 1
    fi
    
    # Download encrypted backup file
    aws s3 cp "s3://$S3_BUCKET/backups/${backup_timestamp}.dump.enc" "$backup_file.enc" \
        --sse aws:kms \
        --sse-kms-key-id "${KMS_KEY_ID}"
    
    if [ $? -ne 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Failed to download backup file" >> "$LOG_FILE"
        return 1
    fi
    
    # Verify checksum
    aws s3 cp "s3://$S3_BUCKET/backups/${backup_timestamp}.sha256" "$backup_file.sha256"
    if ! sha256sum -c "$backup_file.sha256"; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Backup file checksum verification failed" >> "$LOG_FILE"
        return 1
    fi
    
    # Decrypt backup using AWS KMS
    aws kms decrypt \
        --ciphertext-blob fileb://"$backup_file.enc" \
        --output text \
        --query Plaintext \
        --key-id "${KMS_KEY_ID}" > "$backup_file"
    
    if [ $? -ne 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Failed to decrypt backup file" >> "$LOG_FILE"
        return 1
    fi
    
    echo "$backup_file"
    return 0
}

verify_backup_integrity() {
    local backup_file="$1"
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Verifying backup integrity: $backup_file" >> "$LOG_FILE"
    
    # Check if file exists and is readable
    if [ ! -r "$backup_file" ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Backup file not found or not readable" >> "$LOG_FILE"
        return 1
    fi
    
    # Verify backup format and version
    pg_restore --list "$backup_file" &> /dev/null
    if [ $? -ne 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Invalid backup format" >> "$LOG_FILE"
        return 1
    }
    
    # Check for required database objects
    local required_objects=("public.users" "public.drill_attempts" "public.subscriptions")
    for object in "${required_objects[@]}"; do
        if ! pg_restore --list "$backup_file" | grep -q "$object"; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Required object $object not found in backup" >> "$LOG_FILE"
            return 1
        fi
    done
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Backup integrity verification successful" >> "$LOG_FILE"
    return 0
}

perform_database_restore() {
    local backup_file="$1"
    local target_database="$2"
    local retry_count=0
    local restore_start_time
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Starting database restoration" >> "$LOG_FILE"
    
    # Create restore point
    psql "$target_database" -c "SELECT pg_create_restore_point('pre_restore_$(date +%Y%m%d_%H%M%S)')"
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        restore_start_time=$(date +%s)
        
        # Stop application services
        curl -X POST "https://api.vercel.com/v1/deployments/${VERCEL_DEPLOYMENT_ID}/stop" \
            -H "Authorization: Bearer ${VERCEL_TOKEN}"
        
        # Perform restore with parallel workers
        pg_restore --dbname="$target_database" \
            --jobs=4 \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --verbose \
            "$backup_file" 2>> "$LOG_FILE"
        
        restore_status=$?
        
        if [ $restore_status -eq 0 ]; then
            # Calculate restoration time
            restore_end_time=$(date +%s)
            restore_duration=$((restore_end_time - restore_start_time))
            
            # Restart application services
            curl -X POST "https://api.vercel.com/v1/deployments/${VERCEL_DEPLOYMENT_ID}/start" \
                -H "Authorization: Bearer ${VERCEL_TOKEN}"
            
            # Send success notification
            resend emails:send \
                --from="noreply@case-interview-platform.com" \
                --to="admin@case-interview-platform.com" \
                --subject="Database Restoration Successful" \
                --text="Database restored successfully. Duration: ${restore_duration}s"
            
            echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Database restoration completed successfully" >> "$LOG_FILE"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            sleep_time=$((5 * 2 ** (retry_count - 1)))
            echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] Restore failed, retrying in ${sleep_time}s" >> "$LOG_FILE"
            sleep $sleep_time
        fi
    done
    
    # Send failure notification
    resend emails:send \
        --from="noreply@case-interview-platform.com" \
        --to="admin@case-interview-platform.com" \
        --subject="Database Restoration Failed" \
        --text="Database restoration failed after ${MAX_RETRIES} attempts. Check logs for details."
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Database restoration failed after ${MAX_RETRIES} attempts" >> "$LOG_FILE"
    return 1
}

cleanup_restore_files() {
    local files_cleaned=0
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Starting cleanup of restore files" >> "$LOG_FILE"
    
    # Securely remove temporary files
    find "$RESTORE_DIR" -type f -name "*.dump*" -mtime +1 -exec shred -u {} \; -print | while read -r file; do
        echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Removed file: $file" >> "$LOG_FILE"
        files_cleaned=$((files_cleaned + 1))
    done
    
    # Archive old logs
    if [ -f "$LOG_FILE" ]; then
        if [ $(stat -f %z "$LOG_FILE") -gt 10485760 ]; then  # 10MB
            timestamp=$(date +%Y%m%d_%H%M%S)
            gzip -c "$LOG_FILE" > "${LOG_FILE}.${timestamp}.gz"
            truncate -s 0 "$LOG_FILE"
            files_cleaned=$((files_cleaned + 1))
        fi
    fi
    
    # Update audit trail
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Cleanup completed. Files cleaned: $files_cleaned" >> "$LOG_FILE"
    
    return $files_cleaned
}

# Main restoration function
restore_database() {
    local backup_timestamp="$1"
    local target_database="$2"
    
    # Setup environment
    setup_restore_environment
    if [ $? -ne 0 ]; then
        echo "Environment setup failed"
        exit 1
    fi
    
    # Download backup
    local backup_file
    backup_file=$(download_from_s3 "$backup_timestamp")
    if [ $? -ne 0 ]; then
        echo "Backup download failed"
        exit 2
    fi
    
    # Verify backup
    verify_backup_integrity "$backup_file"
    if [ $? -ne 0 ]; then
        echo "Backup verification failed"
        exit 3
    fi
    
    # Perform restoration
    perform_database_restore "$backup_file" "$target_database"
    if [ $? -ne 0 ]; then
        echo "Database restoration failed"
        exit 4
    fi
    
    # Cleanup
    cleanup_restore_files
    
    echo "Database restoration completed successfully"
    exit 0
}

# Script execution
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <backup_timestamp> <target_database>"
    echo "Example: $0 2024-01-15-143000 postgresql://user:pass@host:5432/dbname"
    exit 1
fi

restore_database "$1" "$2"