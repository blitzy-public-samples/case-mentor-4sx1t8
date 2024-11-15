#!/bin/bash

# Human Tasks:
# 1. Ensure curl and jq are installed (minimum versions: curl 7.0+, jq 1.6+)
# 2. Verify network access to all monitored endpoints
# 3. Set up appropriate permissions for script execution (chmod +x)
# 4. Configure monitoring system to execute this script periodically

# Constants derived from Prometheus alert rules
readonly API_LATENCY_THRESHOLD=0.2  # 200ms from HighLatency alert
readonly ERROR_RATE_THRESHOLD=0.05  # 5% from HighErrorRate alert
readonly MEMORY_USAGE_THRESHOLD=0.85  # 85% from HighMemoryUsage alert
readonly CACHE_HIT_THRESHOLD=0.70  # 70% from LowCacheHitRate alert
readonly EXTERNAL_SERVICE_TIMEOUT=300  # 5 minutes from ExternalServiceDown alert

# Endpoints from prometheus.yml
readonly API_ENDPOINT="https://api.caseprep.vercel.app"
readonly DB_ENDPOINT="https://db.caseprep.supabase.co:9090"
readonly REDIS_ENDPOINT="redis:9121"
readonly EXTERNAL_SERVICES=(
    "https://api.openai.com/v1/health"
    "https://api.stripe.com/v1/health"
    "https://api.resend.com/health"
)

# Global status tracking
declare -i overall_status=0

# Requirement: Monitoring & Observability - Implement health checks for API endpoints
check_api_health() {
    local endpoint_url=$1
    local start_time
    local end_time
    local response_time
    local http_code
    
    echo "Checking API health for ${endpoint_url}..."
    
    start_time=$(date +%s.%N)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "${endpoint_url}/health")
    end_time=$(date +%s.%N)
    
    response_time=$(echo "$end_time - $start_time" | bc)
    
    # Requirement: System Performance - Verify API response times are <200ms
    if (( $(echo "$response_time > $API_LATENCY_THRESHOLD" | bc -l) )); then
        echo "ERROR: API response time ${response_time}s exceeds threshold ${API_LATENCY_THRESHOLD}s"
        return 1
    fi
    
    if [[ $http_code != "200" ]]; then
        echo "ERROR: API returned non-200 status code: ${http_code}"
        return 1
    fi
    
    echo "API health check passed"
    return 0
}

# Requirement: Monitoring & Observability - Implement health checks for Supabase database
check_database_health() {
    local database_url=$1
    local http_code
    
    echo "Checking database health at ${database_url}..."
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "${database_url}/health")
    
    if [[ $http_code != "200" ]]; then
        echo "ERROR: Database health check failed with status code: ${http_code}"
        return 1
    fi
    
    echo "Database health check passed"
    return 0
}

# Requirement: Monitoring & Observability - Implement health checks for Redis cache
check_cache_health() {
    local redis_url=$1
    local metrics
    local memory_usage
    local hit_rate
    
    echo "Checking Redis cache health at ${redis_url}..."
    
    # Get Redis metrics from exporter
    metrics=$(curl -s "${redis_url}/metrics")
    if [[ $? -ne 0 ]]; then
        echo "ERROR: Failed to fetch Redis metrics"
        return 1
    fi
    
    # Extract memory usage and hit rate from metrics
    memory_usage=$(echo "${metrics}" | grep "redis_memory_used_bytes" | awk '{print $2}')
    hit_rate=$(echo "${metrics}" | grep "redis_keyspace_hits_total" | awk '{print $2}')
    
    if (( $(echo "$memory_usage > $MEMORY_USAGE_THRESHOLD" | bc -l) )); then
        echo "ERROR: Redis memory usage ${memory_usage} exceeds threshold ${MEMORY_USAGE_THRESHOLD}"
        return 1
    fi
    
    if (( $(echo "$hit_rate < $CACHE_HIT_THRESHOLD" | bc -l) )); then
        echo "ERROR: Redis hit rate ${hit_rate} below threshold ${CACHE_HIT_THRESHOLD}"
        return 1
    }
    
    echo "Redis cache health check passed"
    return 0
}

# Requirement: Monitoring & Observability - Implement health checks for external services
check_external_services() {
    local -a service_endpoints=("$@")
    local status=0
    
    echo "Checking external service health..."
    
    for endpoint in "${service_endpoints[@]}"; do
        local start_time
        start_time=$(date +%s)
        
        if ! curl -s -f -m 10 "${endpoint}" > /dev/null; then
            echo "ERROR: External service ${endpoint} is not responding"
            
            # Check if service has been down for more than 5 minutes
            if [[ -f "/tmp/service_down_${endpoint}" ]]; then
                local down_time
                down_time=$(cat "/tmp/service_down_${endpoint}")
                local current_time
                current_time=$(date +%s)
                
                if (( current_time - down_time > EXTERNAL_SERVICE_TIMEOUT )); then
                    echo "ERROR: External service ${endpoint} has been down for more than 5 minutes"
                    status=1
                fi
            else
                echo "$start_time" > "/tmp/service_down_${endpoint}"
            fi
        else
            rm -f "/tmp/service_down_${endpoint}" 2>/dev/null
        fi
    done
    
    return $status
}

# Requirement: Platform Stability - Monitor platform uptime
main() {
    local status=0
    
    echo "Starting comprehensive system health check..."
    echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo "----------------------------------------"
    
    # Check API health
    if ! check_api_health "$API_ENDPOINT"; then
        status=1
    fi
    
    # Check database health
    if ! check_database_health "$DB_ENDPOINT"; then
        status=1
    fi
    
    # Check cache health
    if ! check_cache_health "$REDIS_ENDPOINT"; then
        status=1
    fi
    
    # Check external services
    if ! check_external_services "${EXTERNAL_SERVICES[@]}"; then
        status=1
    fi
    
    echo "----------------------------------------"
    if [[ $status -eq 0 ]]; then
        echo "Overall system health: HEALTHY"
    else
        echo "Overall system health: UNHEALTHY"
    fi
    
    return $status
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi