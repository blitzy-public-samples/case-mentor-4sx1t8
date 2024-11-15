#!/bin/bash

# Human Tasks:
# 1. Ensure OpenSSL is installed and available in PATH
# 2. Configure AWS CLI with appropriate credentials and permissions
# 3. Set up backup directory with appropriate permissions
# 4. Verify HSM access for production environments
# 5. Set up monitoring for key rotation events

# @requirement: Security Controls - Implementation of key rotation for JWT signing keys and API keys with RSA-256 signing mechanism
# @requirement: Key Management - Automated key rotation with specified rotation periods for different key types

# Import relative path for constants
source ../../src/backend/config/constants.ts

# Define key types and rotation periods
KEY_TYPES=('jwt' 'api' 'database' 'stripe')
declare -A ROTATION_PERIODS=(
    ['jwt']='30d'
    ['api']='180d'
    ['database']='90d'
    ['stripe']='180d'
)

# Backup directory for key storage
BACKUP_DIR="/backup/keys"

# @requirement: Security Controls - Generate new RSA-256 key pair for JWT signing keys
rotate_jwt_keys() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local private_key="jwt_private_${timestamp}.pem"
    local public_key="jwt_public_${timestamp}.pem"
    
    echo "Generating new JWT RSA-256 key pair..."
    
    # Generate private key
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "${private_key}"
    if [ $? -ne 0 ]; then
        echo "Failed to generate private key"
        return 1
    fi
    
    # Generate public key
    openssl rsa -pubout -in "${private_key}" -out "${public_key}"
    if [ $? -ne 0 ]; then
        echo "Failed to generate public key"
        return 1
    }
    
    # Backup existing keys
    backup_keys "jwt"
    
    # Update AWS secrets
    aws secretsmanager update-secret \
        --secret-id jwt_private_key \
        --secret-string "$(cat ${private_key})"
        
    aws secretsmanager update-secret \
        --secret-id jwt_public_key \
        --secret-string "$(cat ${public_key})"
    
    # Verify new keys
    verify_rotation "jwt"
    
    # Cleanup temporary files
    rm -f "${private_key}" "${public_key}"
    
    return 0
}

# @requirement: Key Management - Rotate API keys for external services
rotate_api_keys() {
    echo "Rotating API keys..."
    
    # Backup existing keys
    backup_keys "api"
    
    # Generate new API keys for each service
    local new_openai_key=$(openssl rand -base64 32)
    local new_stripe_key=$(openssl rand -base64 32)
    local new_resend_key=$(openssl rand -base64 32)
    
    # Update AWS secrets
    aws secretsmanager update-secret \
        --secret-id openai_api_key \
        --secret-string "${new_openai_key}"
        
    aws secretsmanager update-secret \
        --secret-id stripe_api_key \
        --secret-string "${new_stripe_key}"
        
    aws secretsmanager update-secret \
        --secret-id resend_api_key \
        --secret-string "${new_resend_key}"
    
    # Update environment variables
    export OPENAI_API_KEY="${new_openai_key}"
    export STRIPE_API_KEY="${new_stripe_key}"
    export RESEND_API_KEY="${new_resend_key}"
    
    # Verify new keys
    verify_rotation "api"
    
    return 0
}

# @requirement: Key Management - Rotate database credentials
rotate_database_credentials() {
    echo "Rotating database credentials..."
    
    # Backup existing credentials
    backup_keys "database"
    
    # Generate new secure password
    local new_password=$(openssl rand -base64 32)
    
    # Update Supabase database password
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
        -h "${SUPABASE_DB_HOST}" \
        -U "${SUPABASE_DB_USER}" \
        -d "${SUPABASE_DB_NAME}" \
        -c "ALTER USER ${SUPABASE_DB_USER} WITH PASSWORD '${new_password}'"
    
    # Update AWS secrets
    aws secretsmanager update-secret \
        --secret-id supabase_db_password \
        --secret-string "${new_password}"
    
    # Update connection string in environment
    export SUPABASE_DB_PASSWORD="${new_password}"
    
    # Verify database connectivity
    verify_rotation "database"
    
    return 0
}

# Create encrypted backup of existing keys
backup_keys() {
    local key_type=$1
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local backup_file="${BACKUP_DIR}/${key_type}_backup_${timestamp}.enc"
    
    # Create backup directory if it doesn't exist
    mkdir -p "${BACKUP_DIR}"
    
    echo "Creating backup for ${key_type} keys..."
    
    # Export current keys to temporary file
    case ${key_type} in
        "jwt")
            aws secretsmanager get-secret-value --secret-id jwt_private_key --query SecretString --output text > temp_backup
            aws secretsmanager get-secret-value --secret-id jwt_public_key --query SecretString --output text >> temp_backup
            ;;
        "api")
            aws secretsmanager get-secret-value --secret-id openai_api_key --query SecretString --output text > temp_backup
            aws secretsmanager get-secret-value --secret-id stripe_api_key --query SecretString --output text >> temp_backup
            aws secretsmanager get-secret-value --secret-id resend_api_key --query SecretString --output text >> temp_backup
            ;;
        "database")
            aws secretsmanager get-secret-value --secret-id supabase_db_password --query SecretString --output text > temp_backup
            ;;
    esac
    
    # Encrypt backup
    openssl enc -aes-256-cbc -salt -in temp_backup -out "${backup_file}"
    
    # Generate checksum
    sha256sum "${backup_file}" > "${backup_file}.sha256"
    
    # Cleanup
    rm -f temp_backup
    
    echo "Backup created: ${backup_file}"
    return 0
}

# Verify newly rotated keys
verify_rotation() {
    local key_type=$1
    
    echo "Verifying ${key_type} rotation..."
    
    case ${key_type} in
        "jwt")
            # Test JWT token generation and verification
            local test_token=$(node -e "
                const jwt = require('../../src/backend/lib/auth/jwt');
                const testUser = { id: 'test', email: 'test@example.com', subscriptionTier: 'free' };
                const token = jwt.generateToken(testUser);
                console.log(token);
            ")
            
            local verify_result=$(node -e "
                const jwt = require('../../src/backend/lib/auth/jwt');
                const result = jwt.verifyToken('${test_token}');
                console.log(result ? 'true' : 'false');
            ")
            
            if [ "${verify_result}" != "true" ]; then
                echo "JWT verification failed"
                return 1
            fi
            ;;
            
        "api")
            # Test API key connectivity
            curl -s -H "Authorization: Bearer ${OPENAI_API_KEY}" \
                https://api.openai.com/v1/models > /dev/null
            if [ $? -ne 0 ]; then
                echo "OpenAI API key verification failed"
                return 1
            fi
            
            curl -s -H "Authorization: Bearer ${STRIPE_API_KEY}" \
                https://api.stripe.com/v1/balance > /dev/null
            if [ $? -ne 0 ]; then
                echo "Stripe API key verification failed"
                return 1
            fi
            ;;
            
        "database")
            # Test database connectivity
            PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
                -h "${SUPABASE_DB_HOST}" \
                -U "${SUPABASE_DB_USER}" \
                -d "${SUPABASE_DB_NAME}" \
                -c "\dt" > /dev/null
            if [ $? -ne 0 ]; then
                echo "Database connection verification failed"
                return 1
            fi
            ;;
    esac
    
    echo "Verification successful for ${key_type}"
    return 0
}

# Main key rotation orchestration function
rotate_keys() {
    echo "Starting key rotation process..."
    
    for key_type in "${KEY_TYPES[@]}"; do
        # Check if rotation is needed based on period
        local last_rotation=$(aws secretsmanager get-secret-value \
            --secret-id "last_rotation_${key_type}" \
            --query SecretString --output text 2>/dev/null || echo "1970-01-01T00:00:00Z")
            
        local current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        local rotation_needed=false
        
        case ${ROTATION_PERIODS[${key_type}]} in
            "30d") 
                if [ $(( $(date -d "${current_time}" +%s) - $(date -d "${last_rotation}" +%s) )) -gt 2592000 ]; then
                    rotation_needed=true
                fi
                ;;
            "90d")
                if [ $(( $(date -d "${current_time}" +%s) - $(date -d "${last_rotation}" +%s) )) -gt 7776000 ]; then
                    rotation_needed=true
                fi
                ;;
            "180d")
                if [ $(( $(date -d "${current_time}" +%s) - $(date -d "${last_rotation}" +%s) )) -gt 15552000 ]; then
                    rotation_needed=true
                fi
                ;;
        esac
        
        if [ "${rotation_needed}" = true ]; then
            echo "Rotating ${key_type} keys..."
            
            case ${key_type} in
                "jwt")
                    rotate_jwt_keys
                    ;;
                "api")
                    rotate_api_keys
                    ;;
                "database")
                    rotate_database_credentials
                    ;;
            esac
            
            if [ $? -eq 0 ]; then
                # Update last rotation timestamp
                aws secretsmanager update-secret \
                    --secret-id "last_rotation_${key_type}" \
                    --secret-string "${current_time}"
                echo "${key_type} keys rotated successfully"
            else
                echo "Failed to rotate ${key_type} keys"
                return 1
            fi
        else
            echo "No rotation needed for ${key_type} keys"
        fi
    done
    
    echo "Key rotation process completed"
    return 0
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    rotate_keys
fi