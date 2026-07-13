#!/bin/bash

# Security Hardening Script for Grubsy Platform Production Server
# This script implements security best practices for the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
fi

# Function to update system packages
update_system() {
    log "Updating system packages..."
    
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get upgrade -y
        apt-get install -y fail2ban ufw unattended-upgrades
    elif command -v yum &> /dev/null; then
        yum update -y
        yum install -y epel-release fail2ban firewalld
    else
        warn "Unsupported package manager. Please update system manually."
    fi
}

# Function to configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian - UFW
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        
        # Allow SSH (change port if needed)
        ufw allow 22/tcp
        
        # Allow HTTP and HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # Allow monitoring ports (restrict to specific IPs in production)
        ufw allow from 127.0.0.1 to any port 9090  # Prometheus
        ufw allow from 127.0.0.1 to any port 3001  # Grafana
        
        ufw --force enable
        log "UFW firewall configured and enabled"
        
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL - firewalld
        systemctl enable firewalld
        systemctl start firewalld
        
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        
        firewall-cmd --reload
        log "Firewalld configured and enabled"
    fi
}

# Function to configure Fail2Ban
configure_fail2ban() {
    log "Configuring Fail2Ban..."
    
    # Create custom jail configuration
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /opt/grubsy-platform/logs/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /opt/grubsy-platform/logs/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /opt/grubsy-platform/logs/nginx/access.log
maxretry = 2
EOF

    # Create custom filters
    cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << 'EOF'
[Definition]
failregex = limiting requests, excess: .* by zone .*, client: <HOST>
ignoreregex =
EOF

    cat > /etc/fail2ban/filter.d/nginx-botsearch.conf << 'EOF'
[Definition]
failregex = <HOST> -.*"(GET|POST).*(\.php|\.asp|\.exe|\.pl|\.cgi|\.scgi)
ignoreregex =
EOF

    systemctl enable fail2ban
    systemctl restart fail2ban
    log "Fail2Ban configured and started"
}

# Function to secure SSH
secure_ssh() {
    log "Securing SSH configuration..."
    
    # Backup original config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Apply security settings
    cat >> /etc/ssh/sshd_config << 'EOF'

# Grubsy Platform SSH Security Settings
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
LoginGraceTime 60
EOF

    # Restart SSH service
    systemctl restart sshd
    log "SSH configuration secured"
}

# Function to configure automatic security updates
configure_auto_updates() {
    log "Configuring automatic security updates..."
    
    if command -v apt-get &> /dev/null; then
        # Configure unattended-upgrades
        cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::Package-Blacklist {
};

Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
EOF

        cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

        systemctl enable unattended-upgrades
        log "Automatic security updates configured"
    fi
}

# Function to set up system monitoring
setup_system_monitoring() {
    log "Setting up system monitoring..."
    
    # Install system monitoring tools
    if command -v apt-get &> /dev/null; then
        apt-get install -y htop iotop nethogs
    elif command -v yum &> /dev/null; then
        yum install -y htop iotop nethogs
    fi
    
    # Create system monitoring script
    cat > /usr/local/bin/system-monitor.sh << 'EOF'
#!/bin/bash
# System monitoring script for Grubsy Platform

LOG_FILE="/var/log/system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# System load
LOAD=$(uptime | awk -F'load average:' '{print $2}')

# Memory usage
MEMORY=$(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2}')

# Disk usage
DISK=$(df -h / | awk 'NR==2{print $5}')

# Docker containers status
CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v NAMES)

echo "[$DATE] Load:$LOAD Memory: $MEMORY Disk: $DISK" >> $LOG_FILE

# Check if any containers are down
if docker ps -a --filter "status=exited" --filter "name=grubsy" --format "{{.Names}}" | grep -q grubsy; then
    echo "[$DATE] WARNING: Some Grubsy containers are down" >> $LOG_FILE
fi
EOF

    chmod +x /usr/local/bin/system-monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/system-monitor.sh") | crontab -
    
    log "System monitoring configured"
}

# Function to secure Docker
secure_docker() {
    log "Securing Docker configuration..."
    
    # Create Docker daemon configuration
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "live-restore": true,
    "userland-proxy": false,
    "no-new-privileges": true,
    "seccomp-profile": "/etc/docker/seccomp.json"
}
EOF

    # Download Docker seccomp profile
    curl -o /etc/docker/seccomp.json https://raw.githubusercontent.com/moby/moby/master/profiles/seccomp/default.json

    # Restart Docker
    systemctl restart docker
    log "Docker security configuration applied"
}

# Function to set up log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > /etc/logrotate.d/grubsy << 'EOF'
/opt/grubsy-platform/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/grubsy-platform/docker-compose.prod.yml exec nginx nginx -s reload > /dev/null 2>&1 || true
    endscript
}

/opt/grubsy-platform/logs/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/grubsy-platform/docker-compose.prod.yml exec nginx nginx -s reload > /dev/null 2>&1 || true
    endscript
}
EOF

    log "Log rotation configured"
}

# Function to create security audit script
create_security_audit() {
    log "Creating security audit script..."
    
    cat > /usr/local/bin/security-audit.sh << 'EOF'
#!/bin/bash
# Security audit script for Grubsy Platform

echo "=== Grubsy Platform Security Audit ==="
echo "Date: $(date)"
echo

echo "=== System Information ==="
uname -a
echo

echo "=== Firewall Status ==="
if command -v ufw &> /dev/null; then
    ufw status
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --list-all
fi
echo

echo "=== Fail2Ban Status ==="
fail2ban-client status
echo

echo "=== Docker Security ==="
docker version
docker info | grep -E "(Security|Runtime)"
echo

echo "=== SSL Certificate Status ==="
if [ -f "/opt/grubsy-platform/ssl/cert.pem" ]; then
    openssl x509 -in /opt/grubsy-platform/ssl/cert.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
else
    echo "SSL certificate not found"
fi
echo

echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "=== Recent Security Events ==="
tail -20 /var/log/auth.log 2>/dev/null || tail -20 /var/log/secure 2>/dev/null || echo "No auth logs found"
echo

echo "=== System Resources ==="
free -h
df -h
echo

echo "=== Network Connections ==="
netstat -tuln | head -20
echo

echo "=== Audit Complete ==="
EOF

    chmod +x /usr/local/bin/security-audit.sh
    log "Security audit script created at /usr/local/bin/security-audit.sh"
}

# Main execution
main() {
    log "Starting security hardening for Grubsy Platform production server"
    
    update_system
    configure_firewall
    configure_fail2ban
    secure_ssh
    configure_auto_updates
    setup_system_monitoring
    secure_docker
    setup_log_rotation
    create_security_audit
    
    log "Security hardening completed successfully!"
    log "Please review the configuration and test all services"
    
    warn "IMPORTANT: Make sure you have SSH key access before disconnecting!"
    warn "Run 'security-audit.sh' to verify the security configuration"
}

# Run main function
main "$@"