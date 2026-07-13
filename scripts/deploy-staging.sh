#!/bin/bash

# Grubsy Platform - Staging Deployment Script
# This script deploys the application to the staging environment

set -e  # Exit on any error

# Configuration
STAGING_HOST="${STAGING_HOST:-staging.grubsy.com}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_TAG="${GITHUB_SHA:-latest}"
COMPOSE_FILE="docker-compose.staging.yml"

echo "🚀 Starting deployment to staging environment..."
echo "Host: $STAGING_HOST"
echo "Image Tag: $IMAGE_TAG"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
    log "❌ Error occurred during deployment"
    log "Rolling back to previous version..."
    docker-compose -f $COMPOSE_FILE down
    docker-compose -f $COMPOSE_FILE up -d --scale grubsy-backend=2
    exit 1
}

# Set error handler
trap handle_error ERR

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log "❌ Docker is not running"
    exit 1
fi

# Check if required environment variables are set
required_vars=("SHEETBEST_URL" "SHEETBEST_API_KEY" "JWT_SECRET" "REDIS_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        log "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Pull latest images
log "📥 Pulling latest Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Create backup of current deployment
log "💾 Creating backup of current deployment..."
BACKUP_DIR="backups/staging-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Export current container states
docker-compose -f $COMPOSE_FILE ps > "$BACKUP_DIR/containers.txt"
docker-compose -f $COMPOSE_FILE logs --tail=100 > "$BACKUP_DIR/logs.txt"

# Run database migrations (if any)
log "🔄 Running database migrations..."
# Add migration commands here if needed

# Blue-Green Deployment Strategy
log "🔄 Starting blue-green deployment..."

# Scale up new instances
log "📈 Scaling up new instances..."
docker-compose -f $COMPOSE_FILE up -d --scale grubsy-backend=2 --no-recreate

# Wait for new instances to be healthy
log "⏳ Waiting for new instances to be healthy..."
sleep 30

# Health check for new instances
log "🏥 Running health checks..."
for i in {1..10}; do
    if curl -f -s "http://$STAGING_HOST/health" > /dev/null; then
        log "✅ Health check passed"
        break
    fi
    if [ $i -eq 10 ]; then
        log "❌ Health check failed after 10 attempts"
        exit 1
    fi
    log "⏳ Health check attempt $i/10 failed, retrying..."
    sleep 10
done

# Run smoke tests
log "🧪 Running smoke tests..."
npm run test:smoke:staging || {
    log "❌ Smoke tests failed"
    exit 1
}

# Switch traffic to new instances
log "🔀 Switching traffic to new instances..."
docker-compose -f $COMPOSE_FILE up -d

# Scale down old instances
log "📉 Scaling down old instances..."
sleep 10
docker-compose -f $COMPOSE_FILE up -d --scale grubsy-backend=1

# Final health check
log "🏥 Final health check..."
sleep 15
if ! curl -f -s "http://$STAGING_HOST/health" > /dev/null; then
    log "❌ Final health check failed"
    exit 1
fi

# Clean up old images
log "🧹 Cleaning up old Docker images..."
docker image prune -f

# Update deployment status
log "📝 Updating deployment status..."
echo "$(date): Deployed $IMAGE_TAG to staging" >> deployments.log

# Send notification
log "📢 Sending deployment notification..."
if [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Staging deployment successful: $IMAGE_TAG\"}" \
        "$SLACK_WEBHOOK"
fi

log "🎉 Staging deployment completed successfully!"
log "🌐 Application is available at: https://$STAGING_HOST"

# Display deployment summary
echo ""
echo "📊 Deployment Summary:"
echo "====================="
echo "Environment: Staging"
echo "Host: $STAGING_HOST"
echo "Image Tag: $IMAGE_TAG"
echo "Deployment Time: $(date)"
echo "Status: ✅ Success"
echo ""

# Show running containers
log "📋 Current running containers:"
docker-compose -f $COMPOSE_FILE ps