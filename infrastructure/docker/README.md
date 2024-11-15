# Docker Infrastructure Documentation

## Overview

This document provides comprehensive setup and usage instructions for the Docker-based infrastructure components of the Case Interview Practice Platform. The infrastructure is divided into two main environments:

1. Development Environment - Local development setup with PostgreSQL, Redis, and MailHog
2. Monitoring Stack - Production monitoring with Prometheus, Grafana, and AlertManager

## Development Environment

### Prerequisites

- Docker Engine 20.10.0+
- Docker Compose 3.8+
- Minimum 4GB RAM allocated to Docker
- Available ports: 5432 (PostgreSQL), 6379 (Redis), 1025/8025 (MailHog)

### Configuration

1. Create environment files:
```bash
# Copy example environment file
cp .env.example .env

# Required environment variables
POSTGRES_PASSWORD=<secure-password>
POSTGRES_USER=postgres
POSTGRES_DB=case_interview_platform
REDIS_PASSWORD=<secure-password>
REDIS_MAX_MEMORY=2gb
MAILHOG_SMTP_PORT=1025
MAILHOG_UI_PORT=8025
```

### Starting Services

```bash
# Start all development services
cd infrastructure/docker/development
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Accessing Services

#### PostgreSQL (Supabase)
- Version: 14.1.0
- Port: 5432
- Connection string: `postgresql://postgres:<password>@localhost:5432/case_interview_platform`
- Features:
  - Supabase extensions pre-installed
  - PostgREST API enabled
  - Real-time subscriptions support

#### Redis Cache
- Version: 6-alpine
- Port: 6379
- Connection: `redis://:<password>@localhost:6379`
- Configuration:
  - Maximum memory: 2GB
  - Eviction policy: allkeys-lru
  - Persistence enabled

#### MailHog
- Version: latest
- SMTP Port: 1025
- Web UI Port: 8025
- Web Interface: http://localhost:8025
- Features:
  - Email testing interface
  - Message search
  - JSON API

### Troubleshooting

Common issues and solutions:

1. Port conflicts:
```bash
# Check for port usage
sudo lsof -i :5432
sudo lsof -i :6379
sudo lsof -i :1025
sudo lsof -i :8025
```

2. Insufficient memory:
```bash
# Verify Redis memory allocation
docker stats redis
```

3. Service health checks:
```bash
# Check service logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs mailhog
```

## Monitoring Stack

### Components

#### Prometheus
- Version: v2.45.0
- Port: 9090
- Purpose: Metrics collection and storage
- Retention: 15 days
- Web Interface: http://localhost:9090

#### Grafana
- Version: 9.5.0
- Port: 3000
- Purpose: Metrics visualization
- Default credentials: admin:<GRAFANA_ADMIN_PASSWORD>
- Features:
  - Pre-configured datasources
  - Custom dashboards
  - Alert management

#### AlertManager
- Version: v0.25.0
- Port: 9093
- Purpose: Alert handling and routing
- Web Interface: http://localhost:9093

### Configuration

1. Set required environment variables:
```bash
# Monitoring stack configuration
GRAFANA_ADMIN_PASSWORD=<secure-password>
```

2. Verify volume mount points:
```bash
# Create data directories
sudo mkdir -p /data/{prometheus,grafana,alertmanager}
sudo chown -R nobody:nogroup /data/prometheus
sudo chown -R 472:472 /data/grafana
sudo chown -R nobody:nogroup /data/alertmanager
```

### Deployment

```bash
# Start monitoring stack
cd infrastructure/docker/monitoring
docker-compose up -d

# Verify services
docker-compose ps
```

### Dashboard Access

1. Prometheus UI: http://localhost:9090
   - Query interface
   - Target status
   - Alert rules

2. Grafana: http://localhost:3000
   - Default dashboards:
     - API Performance
     - System Metrics
     - User Activity
   - Custom dashboard import

3. AlertManager: http://localhost:9093
   - Alert status
   - Silences
   - Configuration

### Alert Configuration

1. Configure notification channels in Grafana:
   - Email
   - Slack
   - PagerDuty

2. Set up alert rules:
```yaml
# Example alert rule
- alert: HighResponseTime
  expr: http_request_duration_seconds > 0.5
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: High API response time
    description: API response time is above 500ms
```

3. Define alert routes in AlertManager:
```yaml
# Example routing
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'team-email'
```

## Security Considerations

1. Network Security:
   - Development services use bridge network isolation
   - Monitoring stack uses dedicated monitoring network
   - No direct container access from host network

2. Access Control:
   - PostgreSQL: Password authentication required
   - Redis: Password protection enabled
   - Grafana: Admin password required
   - AlertManager: No authentication (internal network only)

3. Resource Limits:
   - Redis: 2GB memory limit
   - Prometheus: 15-day retention
   - Container resource constraints defined

4. Data Persistence:
   - PostgreSQL: Named volume for data
   - Redis: Named volume for persistence
   - Prometheus: Bind mount for long-term storage
   - Grafana: Bind mount for configuration

## Maintenance

1. Backup procedures:
```bash
# Backup PostgreSQL data
docker exec postgres pg_dump -U postgres case_interview_platform > backup.sql

# Backup Redis data
docker exec redis redis-cli SAVE
```

2. Log management:
```bash
# Rotate container logs
docker-compose logs --tail=100 > logs/$(date +%Y%m%d).log
```

3. Update procedures:
```bash
# Update service images
docker-compose pull
docker-compose up -d

# Clean up old images
docker image prune -f
```