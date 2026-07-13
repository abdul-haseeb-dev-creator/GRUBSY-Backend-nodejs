#!/bin/bash

# Grubsy Platform - Emergency Rollback Script
# This script provides emergency rollback capabilities for production deployments

set -e  # Exit on any error

# Configuration
ENVIRONMENT="${1:-production}"
ROLLBACK_VERSION="${2}"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🔄 Emergency Rollback Initiated"
echo "Environment: $ENVIRONMENT"
echo "Target Version: ${ROLLBACK_VERSION:-last-known-good}"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle rollback errors
handle_rollback_error() {
    log "❌ CRITICAL: Rollback failed - immediate manual intervention required"
    log "📞 Contact DevOps team immediately"
    
    # Send critical alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 CRITICAL ALERT: Rollback failed for $ENVIRONMENT - manual intervention required immediately\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    exit 1
}

# Set error handler
trap handle_rollback_error ERR

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log "❌ Invalid environment: $ENVIRONMENT (must be 'staging' or 'production')"
    exit 1
fi

# Production rollback requires confirmation
if [[ "$ENVIRONMENT" == "production" ]]; then
    log "⚠️  WARNING: This is a PRODUCTION rollback"
    log "⚠️  This action will affect live users"
    read -p "Are you sure you want to proceed? Type 'ROLLBACK' to confirm: " -r
    if [[ $REPLY != "ROLLBACK" ]]; then
        log "❌ Rollback cancelled"
        exit 1
    fi
fi

# Determine rollback version
if [[ -z "$ROLLBACK_VERSION" ]]; then
    if [[ -f "backups/last-known-good.txt" ]]; then
        ROLLBACK_VERSION=$(cat backups/last-known-good.txt)
        log "📦 Using last known good version: $ROLLBACK_VERSION"
    else
        log "❌ No rollback version specified and no last-known-good version found"
        log "Available backup versions:"
        ls -la backups/ | grep "$ENVIRONMENT-" | tail -5
        exit 1
    fi
fi

# Verify rollback version exists
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
ROLLBACK_IMAGE="$DOCKER_REGISTRY/grubsy-platform/backend:$ROLLBACK_VERSION"

log "🔍 Verifying rollback image exists: $ROLLBACK_IMAGE"
if ! docker manifest inspect "$ROLLBACK_IMAGE" > /dev/null 2>&1; then
    log "❌ Rollback image not found: $ROLLBACK_IMAGE"
    exit 1
fi

# Create rollback backup
log "💾 Creating pre-rollback backup..."
ROLLBACK_BACKUP_DIR="backups/pre-rollback-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ROLLBACK_BACKUP_DIR"

# Backup current state
docker-compose -f $COMPOSE_FILE ps > "$ROLLBACK_BACKUP_DIR/containers.txt"
docker-compose -f $COMPOSE_FILE logs --tail=500 > "$ROLLBACK_BACKUP_DIR/logs.txt"
docker-compose -f $COMPOSE_FILE images > "$ROLLBACK_BACKUP_DIR/images.txt"

# Get current version for logging
CURRENT_VERSION=$(docker-compose -f $COMPOSE_FILE images --format "table {{.Repository}}:{{.Tag}}" | grep backend | head -1 | cut -d':' -f2)
log "📝 Current version: $CURRENT_VERSION"

# Pull rollback image
log "📥 Pulling rollback image..."
docker pull "$ROLLBACK_IMAGE"

# Update compose file with rollback version
log "📝 Updating compose configuration..."
cp $COMPOSE_FILE "${COMPOSE_FILE}.backup"
sed -i "s|image: .*grubsy.*backend:.*|image: $ROLLBACK_IMAGE|g" $COMPOSE_FILE

# Perform rollback deployment
log "🚀 Executing rollback deployment..."

if [[ "$ENVIRONMENT" == "production" ]]; then
    # Production rollback with zero-downtime
    log "🔄 Production rollback with zero-downtime strategy..."
    
    # Scale up with rollback version
    docker-compose -f $COMPOSE_FILE up -d --scale grubsy-backend=2
    
    # Wait for rollback instances to be ready
    log "⏳ Waiting for rollback instances to be ready..."
    sleep 45
    
    # Health check rollback instances
    for i in {1..10}; do
        if curl -f -s "https://grubsy.com/health" > /dev/null; then
            log "✅ Rollback health check passed"
            break
        fi
        if [ $i -eq 10 ]; then
            log "❌ Rollback health check failed"
            exit 1
        fi
        log "⏳ Rollback health check attempt $i/10..."
        sleep 15
    done
    
    # Switch traffic to rollback version
    log "🔀 Switching traffic to rollback version..."
    docker-compose -f $COMPOSE_FILE up -d
    
else
    # Staging rollback - simpler approach
    log "🔄 Staging rollback..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for staging to be ready
    sleep 30
    
    # Health check
    if ! curl -f -s "https://staging.grubsy.com/health" > /dev/null; then
        log "❌ Staging rollback health check failed"
        exit 1
    fi
fi

# Final verification
log "🏥 Final rollback verification..."
sleep 20

# Verify rollback success
if [[ "$ENVIRONMENT" == "production" ]]; then
    HEALTH_URL="https://grubsy.com/health"
else
    HEALTH_URL="https://staging.grubsy.com/health"
fi

for i in {1..5}; do
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        log "✅ Rollback verification successful"
        break
    fi
    if [ $i -eq 5 ]; then
        log "❌ Rollback verification failed"
        exit 1
    fi
    sleep 10
done

# Clean up
log "🧹 Cleaning up..."
docker image prune -f

# Log rollback
log "📝 Recording rollback..."
echo "$(date): Rolled back $ENVIRONMENT from $CURRENT_VERSION to $ROLLBACK_VERSION" >> rollbacks.log

# Send notification
log "📢 Sending rollback notification..."
if [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔄 Rollback completed: $ENVIRONMENT rolled back from $CURRENT_VERSION to $ROLLBACK_VERSION\"}" \
        "$SLACK_WEBHOOK"
fi

log "✅ ROLLBACK COMPLETED SUCCESSFULLY"

# Display rollback summary
echo ""
echo "📊 Rollback Summary:"
echo "==================="
echo "Environment: $ENVIRONMENT"
echo "Previous Version: $CURRENT_VERSION"
echo "Rollback Version: $ROLLBACK_VERSION"
echo "Rollback Time: $(date)"
echo "Status: ✅ Success"
echo "Backup Location: $ROLLBACK_BACKUP_DIR"
echo ""

# Show current status
log "📋 Current container status:"
docker-compose -f $COMPOSE_FILE ps

# Restore original compose file
mv "${COMPOSE_FILE}.backup" $COMPOSE_FILE

log "🎯 Rollback monitoring should continue for the next 15 minutes"
log "📋 Next steps:"
log "   1. Monitor application metrics"
log "   2. Verify user functionality"
log "   3. Investigate root cause of original issue"
log "   4. Plan forward fix deployment"