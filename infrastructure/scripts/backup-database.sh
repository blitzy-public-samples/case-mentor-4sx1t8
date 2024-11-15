#!/bin/bash

# Human Tasks:
# 1. Ensure PostgreSQL client tools (pg_dump) version 14+ are installed
# 2. Install GnuPG 2.0+ for backup encryption
# 3. Install gzip 1.10+ for compression
# 4. Create backup directory with appropriate permissions: /var/backups/postgres
# 5. Create log directory with appropriate permissions: /var/log/postgres
# 6. Import GPG key for backup-key@case-interview-platform.com
# 7. Set up environment variables in deployment environment:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set strict error handling
set -euo pipefail

# Required external tools versions:
# postgresql-client: 14+
# gnupg: 2.0+
# gzip: 1.10+

# Global variables
BACKUP_DIR="/var/backups/postgres"
LOG_FILE="/var/log/postgres/backup.log"
RETENTION_DAYS=30
GPG_RECIPIENT="backup-key@case-interview-platform.com"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DIR=$(mktemp -d)
BACKUP_FILE="${BACKUP_DIR}/supabase_backup_${TIMESTAMP}.sql.gz.gpg"

# Environment variables for database connection
# Requirement: Database Layer - Configure Supabase PostgreSQL with connection details
export PGPASSWORD="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SUPABASE_HOST=$(echo "${NEXT_PUBLIC_SUPABASE_URL}" | sed 's|^https://||' | sed 's|:.*||')
SUPABASE_PORT=5432
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"

# Function to log messages with timestamp
# Requirement: System Performance - Logging for monitoring and debugging
log_message() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
    if [ "${level}" = "ERROR" ]; then
        echo "[${timestamp}] [${level}] ${message}" >&2
    fi
}

# Function to check required dependencies
check_dependencies() {
    local exit_code=0

    # Check PostgreSQL client
    if ! command -v pg_dump >/dev/null 2>&1; then
        log_message "pg_dump not found. Please install postgresql-client 14+" "ERROR"
        exit_code=1
    fi

    # Check GPG
    if ! command -v gpg >/dev/null 2>&1; then
        log_message "gpg not found. Please install gnupg 2.0+" "ERROR"
        exit_code=1
    fi

    # Check gzip
    if ! command -v gzip >/dev/null 2>&1; then
        log_message "gzip not found. Please install gzip 1.10+" "ERROR"
        exit_code=1
    fi

    # Check environment variables
    if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
        log_message "Required environment variables not set" "ERROR"
        exit_code=1
    fi

    # Check directories
    if [ ! -d "${BACKUP_DIR}" ] || [ ! -w "${BACKUP_DIR}" ]; then
        log_message "Backup directory ${BACKUP_DIR} does not exist or is not writable" "ERROR"
        exit_code=1
    fi

    if [ ! -d "$(dirname "${LOG_FILE}")" ] || [ ! -w "$(dirname "${LOG_FILE}")" ]; then
        log_message "Log directory $(dirname "${LOG_FILE}") does not exist or is not writable" "ERROR"
        exit_code=1
    fi

    return ${exit_code}
}

# Function to create encrypted and compressed backup
# Requirement: Data Security - Protection of confidential data through encrypted backups
create_backup() {
    local temp_backup="${TEMP_DIR}/backup.sql"
    local temp_compressed="${TEMP_DIR}/backup.sql.gz"
    local exit_code=0

    log_message "Starting database backup"

    # Create SQL backup
    if ! pg_dump \
        -h "${SUPABASE_HOST}" \
        -p "${SUPABASE_PORT}" \
        -U "${SUPABASE_USER}" \
        -d "${SUPABASE_DB}" \
        -F p \
        -f "${temp_backup}" \
        --no-owner \
        --no-acl; then
        log_message "Failed to create database backup" "ERROR"
        exit_code=1
        return ${exit_code}
    fi

    # Compress backup
    if ! gzip -9 "${temp_backup}"; then
        log_message "Failed to compress backup" "ERROR"
        exit_code=1
        return ${exit_code}
    fi

    # Encrypt backup
    if ! gpg --recipient "${GPG_RECIPIENT}" \
        --trust-model always \
        --encrypt \
        --output "${BACKUP_FILE}" \
        "${temp_compressed}"; then
        log_message "Failed to encrypt backup" "ERROR"
        exit_code=1
        return ${exit_code}
    fi

    log_message "Backup created successfully: ${BACKUP_FILE}"
    return ${exit_code}
}

# Function to validate backup file
validate_backup() {
    local backup_file="$1"
    local exit_code=0

    # Check if backup exists
    if [ ! -f "${backup_file}" ]; then
        log_message "Backup file does not exist: ${backup_file}" "ERROR"
        return 1
    fi

    # Check file size
    local file_size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}")
    if [ "${file_size}" -lt 1024 ]; then
        log_message "Backup file is too small: ${file_size} bytes" "ERROR"
        exit_code=1
    fi

    # Verify GPG encryption
    if ! gpg --list-packets "${backup_file}" >/dev/null 2>&1; then
        log_message "Invalid GPG encryption" "ERROR"
        exit_code=1
    fi

    return ${exit_code}
}

# Function to clean up old backups
# Requirement: Database Layer - Implement backup retention policies
cleanup_old_backups() {
    local retention_days="$1"
    local count=0

    log_message "Cleaning up backups older than ${retention_days} days"

    while IFS= read -r backup; do
        if rm "${backup}"; then
            count=$((count + 1))
            log_message "Removed old backup: ${backup}"
        else
            log_message "Failed to remove backup: ${backup}" "ERROR"
        fi
    done < <(find "${BACKUP_DIR}" -name "supabase_backup_*.sql.gz.gpg" -type f -mtime "+${retention_days}")

    log_message "Removed ${count} old backup(s)"
    return 0
}

# Main execution
main() {
    local exit_code=0

    log_message "Starting backup process"

    # Check dependencies
    if ! check_dependencies; then
        log_message "Dependency check failed" "ERROR"
        exit 1
    fi

    # Create backup
    if ! create_backup; then
        log_message "Backup creation failed" "ERROR"
        exit_code=1
    fi

    # Validate backup
    if [ ${exit_code} -eq 0 ]; then
        if ! validate_backup "${BACKUP_FILE}"; then
            log_message "Backup validation failed" "ERROR"
            exit_code=1
        fi
    fi

    # Cleanup old backups
    if [ ${exit_code} -eq 0 ]; then
        if ! cleanup_old_backups "${RETENTION_DAYS}"; then
            log_message "Cleanup of old backups failed" "ERROR"
            exit_code=1
        fi
    fi

    # Cleanup temporary directory
    rm -rf "${TEMP_DIR}"

    if [ ${exit_code} -eq 0 ]; then
        log_message "Backup process completed successfully"
    else
        log_message "Backup process failed" "ERROR"
    fi

    return ${exit_code}
}

# Execute main function
main
exit $?