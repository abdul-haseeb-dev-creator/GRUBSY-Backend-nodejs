#!/bin/bash

# Grubsy Platform Backup Script
# This script creates backups of application data, logs, and configurations

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="grubsy_backup_${DATE}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# AWS S3 Configuration (optional)
S3_BUCKET=${BACKUP_S3_BUCKET:-""}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

echo "Starting backup process at $(date)"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to create tar backup
create_backup() {
    local source_dir=$1
    local backup_name=$2
    
    if [ -d "$source_dir" ]; then
        log "Backing up $source_dir to $backup_name"
        tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/${backup_name}.tar.gz" -C "$(dirname "$source_dir")" "$(basename "$source_dir")"
    else
        log "Warning: $source_dir does not exist, skipping"
    fi
}

# Backup application uploads
create_backup "/data/uploads" "uploads"

# Backup application logs
create_backup "/data/logs" "logs"

# Backup configuration files
if [ -f "/opt/grubsy-platform/.env" ]; then
    log "Backing up environment configuration"
    cp "/opt/grubsy-platform/.env" "${BACKUP_DIR}/${BACKUP_NAME}/env_backup"
fi

# Backup Docker Compose configuration
if [ -f "/opt/grubsy-platform/docker-compose.prod.yml" ]; then
    log "Backing up Docker Compose configuration"
    cp "/opt/grubsy-platform/docker-compose.prod.yml" "${BACKUP_DIR}/${BACKUP_NAME}/"
fi

# Backup Nginx configuration
if [ -d "/opt/grubsy-platform/nginx" ]; then
    create_backup "/opt/grubsy-platform/nginx" "nginx_config"
fi

# Backup monitoring configuration
if [ -d "/opt/grubsy-platform/monitoring" ]; then
    create_backup "/opt/grubsy-platform/monitoring" "monitoring_config"
fi

# Export Docker volumes (Redis data, etc.)
log "Backing up Docker volumes"
docker run --rm -v grubsy-platform_redis-data:/data -v "${BACKUP_DIR}/${BACKUP_NAME}":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
docker run --rm -v grubsy-platform_prometheus-data:/data -v "${BACKUP_DIR}/${BACKUP_NAME}":/backup alpine tar czf /backup/prometheus_data.tar.gz -C /data .
docker run --rm -v grubsy-platform_grafana-data:/data -v "${BACKUP_DIR}/${BACKUP_NAME}":/backup alpine tar czf /backup/grafana_data.tar.gz -C /data .

# Create backup metadata
cat > "${BACKUP_DIR}/${BACKUP_NAME}/backup_info.txt" << EOF
Backup Information
==================
Date: $(date)
Hostname: $(hostname)
Backup Name: ${BACKUP_NAME}
Docker Images:
$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.Size}}" | grep grubsy || echo "No Grubsy images found")

Services Status:
$(docker-compose -f /opt/grubsy-platform/docker-compose.prod.yml ps || echo "Could not get service status")
EOF

# Create final backup archive
log "Creating final backup archive"
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    log "Uploading backup to S3 bucket: $S3_BUCKET"
    
    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        apk add --no-cache aws-cli
    fi
    
    aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "s3://${S3_BUCKET}/backups/${BACKUP_NAME}.tar.gz" --region "$AWS_REGION"
    
    if [ $? -eq 0 ]; then
        log "Backup successfully uploaded to S3"
        # Remove local backup after successful upload
        rm -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    else
        log "Failed to upload backup to S3, keeping local copy"
    fi
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days"
find "${BACKUP_DIR}" -name "grubsy_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups if configured
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    log "Cleaning up old S3 backups"
    aws s3 ls "s3://${S3_BUCKET}/backups/" --region "$AWS_REGION" | while read -r line; do
        backup_date=$(echo "$line" | awk '{print $1}')
        backup_file=$(echo "$line" | awk '{print $4}')
        
        if [ -n "$backup_date" ] && [ -n "$backup_file" ]; then
            backup_timestamp=$(date -d "$backup_date" +%s)
            cutoff_timestamp=$(date -d "$RETENTION_DAYS days ago" +%s)
            
            if [ "$backup_timestamp" -lt "$cutoff_timestamp" ]; then
                log "Deleting old S3 backup: $backup_file"
                aws s3 rm "s3://${S3_BUCKET}/backups/${backup_file}" --region "$AWS_REGION"
            fi
        fi
    done
fi

# Send notification (if configured)
if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
    echo "Backup completed successfully at $(date)" | mail -s "Grubsy Platform Backup Completed" "$ALERT_EMAIL"
fi

log "Backup process completed successfully"
log "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Exit with success
exit 0