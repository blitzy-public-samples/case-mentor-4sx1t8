#!/bin/bash
set -euo pipefail

# Human Tasks:
# 1. Ensure firewall rules allow traffic on ports 9090 (Prometheus), 3000 (Grafana), and 9093 (AlertManager)
# 2. Configure DNS records if using custom domains for monitoring services
# 3. Set up SSL certificates if enabling HTTPS for monitoring endpoints
# 4. Review and customize alert notification settings (email, Slack, etc.)
# 5. Verify storage volume mounting for persistent data

# Environment Variables
PROMETHEUS_VERSION=2.45.0
GRAFANA_VERSION=9.5.0
MONITORING_DIR=/opt/monitoring
LOG_FILE=/var/log/monitoring-setup.log

# Logging setup
exec 1> >(tee -a "${LOG_FILE}") 2>&1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting monitoring infrastructure setup..."

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Setup failed with exit code $exit_code"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up..."
        docker-compose down 2>/dev/null || true
        rm -rf "${MONITORING_DIR}/tmp" 2>/dev/null || true
    fi
    exit $exit_code
}
trap cleanup EXIT

# Function to check prerequisites
check_prerequisites() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking prerequisites..."

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        echo "ERROR: This script must be run as root"
        return 1
    }

    # Check Docker installation
    if ! command -v docker >/dev/null 2>&1; then
        echo "ERROR: Docker is not installed"
        return 1
    fi
    
    # Verify Docker version
    local docker_version=$(docker --version | cut -d ' ' -f3 | cut -d '.' -f1)
    if [ "${docker_version}" -lt 24 ]; then
        echo "ERROR: Docker version 24.0+ is required"
        return 1
    }

    # Check Docker Compose installation
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo "ERROR: Docker Compose is not installed"
        return 1
    }

    # Check curl installation
    if ! command -v curl >/dev/null 2>&1; then
        echo "ERROR: curl is not installed"
        return 1
    }

    # Check if required ports are available
    for port in 9090 3000 9093; do
        if netstat -tuln | grep -q ":${port} "; then
            echo "ERROR: Port ${port} is already in use"
            return 1
        fi
    done

    # Create required directories
    mkdir -p "${MONITORING_DIR}"/{prometheus,grafana,alertmanager}/data
    mkdir -p "${MONITORING_DIR}/prometheus/rules"
    
    return 0
}

# Function to setup Prometheus
setup_prometheus() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Setting up Prometheus..."

    # Copy Prometheus configuration
    cp ../monitoring/prometheus/prometheus.yml "${MONITORING_DIR}/prometheus/prometheus.yml"

    # Create Docker Compose configuration for Prometheus
    cat > "${MONITORING_DIR}/docker-compose.yml" <<EOF
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:v${PROMETHEUS_VERSION}
    volumes:
      - ${MONITORING_DIR}/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ${MONITORING_DIR}/prometheus/rules:/etc/prometheus/rules
      - ${MONITORING_DIR}/prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--storage.tsdb.retention.size=50GB'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    restart: unless-stopped
EOF

    # Start Prometheus
    docker-compose -f "${MONITORING_DIR}/docker-compose.yml" up -d prometheus

    # Verify Prometheus is responding
    for i in {1..30}; do
        if curl -s "http://localhost:9090/-/healthy" >/dev/null; then
            echo "Prometheus is running"
            return 0
        fi
        sleep 2
    done
    echo "ERROR: Prometheus failed to start"
    return 1
}

# Function to setup Grafana
setup_grafana() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Setting up Grafana..."

    # Create Grafana provisioning directories
    mkdir -p "${MONITORING_DIR}/grafana/provisioning/"{datasources,dashboards}

    # Configure Prometheus datasource
    cat > "${MONITORING_DIR}/grafana/provisioning/datasources/prometheus.yml" <<EOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    # Copy dashboard configuration
    mkdir -p "${MONITORING_DIR}/grafana/dashboards"
    cp ../monitoring/grafana/dashboards/api-metrics.json "${MONITORING_DIR}/grafana/dashboards/"

    # Add Grafana to docker-compose
    cat >> "${MONITORING_DIR}/docker-compose.yml" <<EOF
  grafana:
    image: grafana/grafana:${GRAFANA_VERSION}
    volumes:
      - ${MONITORING_DIR}/grafana/data:/var/lib/grafana
      - ${MONITORING_DIR}/grafana/provisioning:/etc/grafana/provisioning
      - ${MONITORING_DIR}/grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    restart: unless-stopped
EOF

    # Start Grafana
    docker-compose -f "${MONITORING_DIR}/docker-compose.yml" up -d grafana

    # Verify Grafana is responding
    for i in {1..30}; do
        if curl -s "http://localhost:3000/api/health" >/dev/null; then
            echo "Grafana is running"
            return 0
        fi
        sleep 2
    done
    echo "ERROR: Grafana failed to start"
    return 1
}

# Function to configure alerting
configure_alerting() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Configuring alerting..."

    # Create AlertManager configuration
    mkdir -p "${MONITORING_DIR}/alertmanager"
    cat > "${MONITORING_DIR}/alertmanager/config.yml" <<EOF
route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
receivers:
  - name: 'default'
    email_configs:
      - to: 'alerts@caseplatform.com'
        from: 'monitoring@caseplatform.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@caseplatform.com'
        auth_password: 'password'
EOF

    # Add AlertManager to docker-compose
    cat >> "${MONITORING_DIR}/docker-compose.yml" <<EOF
  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ${MONITORING_DIR}/alertmanager:/etc/alertmanager
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    restart: unless-stopped
EOF

    # Start AlertManager
    docker-compose -f "${MONITORING_DIR}/docker-compose.yml" up -d alertmanager

    # Verify AlertManager is responding
    for i in {1..30}; do
        if curl -s "http://localhost:9093/-/healthy" >/dev/null; then
            echo "AlertManager is running"
            return 0
        fi
        sleep 2
    done
    echo "ERROR: AlertManager failed to start"
    return 1
}

# Function to verify setup
verify_setup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verifying monitoring setup..."

    local failed=0

    # Check Prometheus
    if ! curl -s "http://localhost:9090/api/v1/targets" | grep -q "\"health\":\"up\""; then
        echo "ERROR: Prometheus targets are not healthy"
        failed=1
    fi

    # Check Grafana
    if ! curl -s "http://localhost:3000/api/health" | grep -q "ok"; then
        echo "ERROR: Grafana is not healthy"
        failed=1
    fi

    # Check AlertManager
    if ! curl -s "http://localhost:9093/-/healthy" | grep -q "ok"; then
        echo "ERROR: AlertManager is not healthy"
        failed=1
    fi

    return $failed
}

# Main execution
main() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting monitoring setup..."

    check_prerequisites || exit 1
    setup_prometheus || exit 1
    setup_grafana || exit 1
    configure_alerting || exit 1
    verify_setup || exit 1

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Monitoring setup completed successfully"
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3000 (admin/admin)"
    echo "AlertManager: http://localhost:9093"
}

main