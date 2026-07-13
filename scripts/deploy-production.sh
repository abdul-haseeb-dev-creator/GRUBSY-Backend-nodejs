#!/bin/bash

# Grubsy Platform - Production Deployment Script
# This script deploys the application to the production environment with advanced safety measures

set -e  # Exit on any error

# Configuration
PRODUCTION_HOST="${PRODUCTION_HOST:-grubsy.com}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_TAG="${GITHUB_SHA:-latest}"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_RETENTION_DAYS=30

echo "🚀 Starting deployment to PRODUCTION environment..."
echo "⚠️  This is a PRODUCTION deployment - extra safety measures enabled"
echo "Host: $PRODUCTION_HOST"
echo "Image Tag: $IMAGE_TAG"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors with automatic rollback
handle_error() {
    log "❌ CRITICAL ERROR occurred during production deployment"
    log "🔄 Initiating automatic rollback..."
    
    # Rollback to previous version
    if [[ -f "backups/last-known-good.txt" ]]; then
        ROLLBACK_TAG=$(cat backups/last-known-good.txt)
        log "📦 Rolling back to: $ROLLBACK_TAG"
        
        # Update image tags to rollback version
        sed -i "s|image: .*grubsy.*:.*|image: $DOCKER_REGISTRY/grubsy-platform/backend:$ROLLBACK_TAG|g" $COMPOSE_FILE
        
        # Deploy rollback version
        docker-compose -f $COMPOSE_FILE up -d
        
        # Wait for rollback to be healthy
        sleep 30
        if curl -f -s "https://$PRODUCTION_HOST/health" > /dev/null; then
            log "✅ Rollback successful - production is stable"
        else
            log "❌ CRITICAL: Rollback failed - manual intervention required"
        fi
    else
        log "❌ CRITICAL: No rollback version available - manual intervention required"
    fi
    
    # Send critical alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 CRITICAL: Production deployment failed and rollback initiated for $IMAGE_TAG\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    exit 1
}

# Set error handler
trap handle_error ERR

# Pre-deployment safety checks
log "🔒 Running comprehensive pre-deployment safety checks..."

# Check if this is a valid production deployment time (avoid peak hours)
current_hour=$(date +%H)
if [[ $current_hour -ge 11 && $current_hour -le 14 ]] || [[ $current_hour -ge 18 && $current_hour -le 20 ]]; then
    log "⚠️  WARNING: Deploying during potential peak hours ($current_hour:00)"
    read -p "Continue with deployment? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "❌ Deployment cancelled by user"
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log "❌ Docker is not running"
    exit 1
fi

# Verify all required environment variables
required_vars=("SHEETBEST_URL" "SHEETBEST_API_KEY" "JWT_SECRET" "REDIS_PASSWORD" "GRAFANA_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        log "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Check current production health
log "🏥 Verifying current production health..."
if ! curl -f -s "https://$PRODUCTION_HOST/health" > /dev/null; then
    log "❌ Current production is unhealthy - aborting deployment"
    exit 1
fi

# Create comprehensive backup
log "💾 Creating comprehensive production backup..."
BACKUP_DIR="backups/production-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup current deployment state
docker-compose -f $COMPOSE_FILE ps > "$BACKUP_DIR/containers.txt"
docker-compose -f $COMPOSE_FILE logs --tail=1000 > "$BACKUP_DIR/logs.txt"
docker-compose -f $COMPOSE_FILE config > "$BACKUP_DIR/compose-config.yml"

# Backup database (if applicable)
log "💾 Backing up application data..."
docker-compose -f $COMPOSE_FILE exec -T redis redis-cli --rdb /data/backup.rdb
docker cp $(docker-compose -f $COMPOSE_FILE ps -q redis):/data/backup.rdb "$BACKUP_DIR/"

# Store current image tag as last known good
docker-compose -f $COMPOSE_FILE images --format "table {{.Repository}}:{{.Tag}}" | grep backend | head -1 > backups/last-known-good.txt

# Pull and verify new images
log "📥 Pulling and verifying new Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Security scan of new images
log "🔍 Running security scan on new images..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image --exit-code 1 --severity HIGH,CRITICAL \
    $DOCKER_REGISTRY/grubsy-platform/backend:$IMAGE_TAG || {
    log "❌ Security vulnerabilities found in new image"
    exit 1
}

# Run pre-deployment tests
log "🧪 Running pre-deployment tests..."
npm run test:pre-deploy || {
    log "❌ Pre-deployment tests failed"
    exit 1
}

# Blue-Green Deployment with Canary Release
log "🔄 Starting blue-green deployment with canary release..."

# Phase 1: Deploy canary (10% traffic)
log "🐤 Phase 1: Deploying canary release (10% traffic)..."
docker-compose -f $COMPOSE_FILE up -d --scale grubsy-backend=3

# Wait for canary to be ready
log "⏳ Waiting for canary instances to be ready..."
sleep 45

# Health check canary instances
log "🏥 Health checking canary instances..."
for i in {1..15}; do
    if curl -f -s "https://$PRODUCTION_HOST/health" > /dev/null; then
        log "✅ Canary health check passed"
        break
    fi
    if [ $i -eq 15 ]; then
        log "❌ Canary health check failed after 15 attempts"
        exit 1
    fi
    log "⏳ Canary health check attempt $i/15 failed, retrying..."
    sleep 20
done

# Monitor canary for 5 minutes
log "📊 Monitoring canary performance for 5 minutes..."
for i in {1..10}; do
    # Check error rates, response times, etc.
    if ! curl -f -s "https://$PRODUCTION_HOST/metrics" > /dev/null; then
        log "❌ Canary showing errors - aborting deployment"
        exit 1
    fi
    log "📈 Canary monitoring check $i/10 passed"
    sleep 30
done

# Phase 2: Full deployment (100% traffic)
log "🚀 Phase 2: Full deployment (100% traffic)..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for full deployment
log "⏳ Waiting for full deployment to stabilize..."
sleep 60

# Comprehensive health checks
log "🏥 Running comprehensive health checks..."
health_checks=(
    "https://$PRODUCTION_HOST/health"
    "https://$PRODUCTION_HOST/api/establishments"
    "https://$PRODUCTION_HOST/metrics"
)

for endpoint in "${health_checks[@]}"; do
    for i in {1..5}; do
        if curl -f -s "$endpoint" > /dev/null; then
            log "✅ Health check passed: $endpoint"
            break
        fi
        if [ $i -eq 5 ]; then
            log "❌ Health check failed: $endpoint"
            exit 1
        fi
        sleep 10
    done
done

# Run post-deployment tests
log "🧪 Running post-deployment tests..."
npm run test:post-deploy || {
    log "❌ Post-deployment tests failed"
    exit 1
}

# Performance verification
log "⚡ Running performance verification..."
npm run test:performance:quick || {
    log "❌ Performance verification failed"
    exit 1
}

# Update last known good version
echo "$IMAGE_TAG" > backups/last-known-good.txt

# Clean up old backups
log "🧹 Cleaning up old backups..."
find backups/ -name "production-*" -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} \;

# Clean up old images
log "🧹 Cleaning up old Docker images..."
docker image prune -f

# Update deployment log
log "📝 Updating deployment records..."
echo "$(date): Successfully deployed $IMAGE_TAG to production" >> deployments.log

# Send success notification
log "📢 Sending success notification..."
if [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🎉 Production deployment successful: $IMAGE_TAG deployed to $PRODUCTION_HOST\"}" \
        "$SLACK_WEBHOOK"
fi

log "🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!"
log "🌐 Application is live at: https://$PRODUCTION_HOST"

# Display comprehensive deployment summary
echo ""
echo "📊 Production Deployment Summary:"
echo "================================="
echo "Environment: Production"
echo "Host: $PRODUCTION_HOST"
echo "Image Tag: $IMAGE_TAG"
echo "Deployment Time: $(date)"
echo "Status: ✅ Success"
echo "Backup Location: $BACKUP_DIR"
echo "Previous Version: $(cat backups/last-known-good.txt 2>/dev/null || echo 'N/A')"
echo ""

# Show final container status
log "📋 Final container status:"
docker-compose -f $COMPOSE_FILE ps

# Show resource usage
log "📊 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

log "✅ Production deployment monitoring will continue for the next 30 minutes"