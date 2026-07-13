#!/bin/bash

# SSL Certificate Setup Script for Grubsy Platform
# This script sets up SSL certificates using Let's Encrypt or custom certificates

set -e

# Configuration
DOMAIN_NAME=${DOMAIN_NAME:-"yourdomain.com"}
API_DOMAIN=${API_DOMAIN:-"api.yourdomain.com"}
EMAIL=${ALERT_EMAIL:-"admin@yourdomain.com"}
SSL_DIR="/opt/grubsy-platform/ssl"
NGINX_DIR="/opt/grubsy-platform/nginx"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
fi

# Create SSL directory
mkdir -p "$SSL_DIR"

# Function to install Certbot
install_certbot() {
    log "Installing Certbot..."
    
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx
    elif command -v apk &> /dev/null; then
        # Alpine
        apk add --no-cache certbot certbot-nginx
    else
        error "Unsupported package manager. Please install Certbot manually."
        exit 1
    fi
}

# Function to obtain Let's Encrypt certificate
obtain_letsencrypt_cert() {
    log "Obtaining Let's Encrypt certificate for $DOMAIN_NAME and $API_DOMAIN"
    
    # Stop nginx temporarily
    docker-compose -f /opt/grubsy-platform/docker-compose.prod.yml stop nginx || true
    
    # Obtain certificate
    certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN_NAME,www.$DOMAIN_NAME,$API_DOMAIN" \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        log "Certificate obtained successfully"
        
        # Copy certificates to SSL directory
        cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" "$SSL_DIR/cert.pem"
        cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" "$SSL_DIR/private.key"
        
        # Set proper permissions
        chmod 644 "$SSL_DIR/cert.pem"
        chmod 600 "$SSL_DIR/private.key"
        chown root:root "$SSL_DIR"/*
        
        log "Certificates copied to $SSL_DIR"
    else
        error "Failed to obtain Let's Encrypt certificate"
        return 1
    fi
}

# Function to generate self-signed certificate (for testing)
generate_self_signed_cert() {
    warn "Generating self-signed certificate for testing purposes"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/private.key" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$DOMAIN_NAME"
    
    # Set proper permissions
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/private.key"
    chown root:root "$SSL_DIR"/*
    
    warn "Self-signed certificate generated. This should only be used for testing!"
}

# Function to setup certificate renewal
setup_renewal() {
    log "Setting up automatic certificate renewal"
    
    # Create renewal script
    cat > /usr/local/bin/renew-grubsy-certs.sh << 'EOF'
#!/bin/bash
set -e

# Renew certificates
certbot renew --quiet --no-self-upgrade

# Copy renewed certificates
if [ -f "/etc/letsencrypt/live/DOMAIN_NAME/fullchain.pem" ]; then
    cp "/etc/letsencrypt/live/DOMAIN_NAME/fullchain.pem" "/opt/grubsy-platform/ssl/cert.pem"
    cp "/etc/letsencrypt/live/DOMAIN_NAME/privkey.pem" "/opt/grubsy-platform/ssl/private.key"
    
    # Reload nginx
    docker-compose -f /opt/grubsy-platform/docker-compose.prod.yml exec nginx nginx -s reload
    
    echo "Certificates renewed and nginx reloaded"
fi
EOF

    # Replace placeholder with actual domain
    sed -i "s/DOMAIN_NAME/$DOMAIN_NAME/g" /usr/local/bin/renew-grubsy-certs.sh
    chmod +x /usr/local/bin/renew-grubsy-certs.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/renew-grubsy-certs.sh >> /var/log/cert-renewal.log 2>&1") | crontab -
    
    log "Certificate renewal scheduled for 3 AM daily"
}

# Function to validate certificates
validate_certificates() {
    log "Validating SSL certificates"
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/private.key" ]; then
        error "Certificate files not found in $SSL_DIR"
        return 1
    fi
    
    # Check certificate validity
    if openssl x509 -in "$SSL_DIR/cert.pem" -text -noout > /dev/null 2>&1; then
        log "Certificate is valid"
        
        # Show certificate details
        echo "Certificate details:"
        openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
        
        return 0
    else
        error "Certificate is invalid"
        return 1
    fi
}

# Function to update Nginx configuration with actual domain
update_nginx_config() {
    log "Updating Nginx configuration with domain names"
    
    if [ -f "$NGINX_DIR/nginx.conf" ]; then
        # Replace placeholder domains with actual domains
        sed -i "s/yourdomain\.com/$DOMAIN_NAME/g" "$NGINX_DIR/nginx.conf"
        sed -i "s/api\.yourdomain\.com/$API_DOMAIN/g" "$NGINX_DIR/nginx.conf"
        
        log "Nginx configuration updated"
    else
        warn "Nginx configuration file not found at $NGINX_DIR/nginx.conf"
    fi
}

# Main execution
main() {
    log "Starting SSL setup for Grubsy Platform"
    
    # Check if certificates already exist
    if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/private.key" ]; then
        log "SSL certificates already exist"
        if validate_certificates; then
            log "Existing certificates are valid"
            read -p "Do you want to renew certificates? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Skipping certificate renewal"
                exit 0
            fi
        fi
    fi
    
    # Ask user for certificate type
    echo "Choose certificate option:"
    echo "1) Let's Encrypt (recommended for production)"
    echo "2) Self-signed (for testing only)"
    read -p "Enter choice (1-2): " choice
    
    case $choice in
        1)
            install_certbot
            if obtain_letsencrypt_cert; then
                setup_renewal
            else
                error "Failed to obtain Let's Encrypt certificate"
                exit 1
            fi
            ;;
        2)
            generate_self_signed_cert
            ;;
        *)
            error "Invalid choice"
            exit 1
            ;;
    esac
    
    # Validate certificates
    if validate_certificates; then
        update_nginx_config
        log "SSL setup completed successfully"
        log "You can now start the Grubsy Platform with SSL enabled"
    else
        error "SSL setup failed"
        exit 1
    fi
}

# Run main function
main "$@"