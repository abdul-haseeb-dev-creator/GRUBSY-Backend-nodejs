# Grubsy Platform CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline for the Grubsy Platform, a multi-component food delivery system consisting of:

- **Grubsy-Backend**: Node.js/Express API server
- **Grubsy-driver-app**: React Native driver application
- **Grubsy-user-app**: React Native customer application
- **Grubsy-establishments-app**: React Native establishment management app

## Pipeline Architecture

### 1. Continuous Integration (CI)

The CI pipeline is triggered on:
- Push to `main`, `develop`, or `staging` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

#### CI Stages:

1. **Security Scanning**
   - Trivy vulnerability scanner
   - Semgrep security analysis
   - OWASP dependency check

2. **Code Quality Analysis**
   - ESLint for all JavaScript/TypeScript code
   - SonarCloud comprehensive analysis
   - Code coverage reporting

3. **Testing**
   - Unit tests for backend and mobile apps
   - Integration tests for API endpoints
   - End-to-end tests using Playwright
   - Performance tests using K6

4. **Build & Package**
   - Docker image building for backend
   - Multi-architecture support (amd64, arm64)
   - Image security scanning

### 2. Continuous Deployment (CD)

#### Deployment Environments:

1. **Staging Environment**
   - Deployed from `develop` branch
   - Automatic deployment after successful CI
   - Used for integration testing and QA

2. **Production Environment**
   - Deployed from `main` branch
   - Manual approval required
   - Blue-green deployment strategy
   - Comprehensive monitoring and rollback capabilities

## Pipeline Configuration

### GitHub Actions Workflow

The main workflow file: `.github/workflows/ci-cd-pipeline.yml`

Key features:
- Parallel job execution for faster builds
- Conditional deployments based on branch
- Comprehensive error handling
- Slack notifications for deployment status

### Environment Variables

Required secrets in GitHub repository:

```bash
# API Keys
SHEETBEST_URL=<sheetbest-api-url>
SHEETBEST_API_KEY=<sheetbest-api-key>
JWT_SECRET=<jwt-secret-key>

# Infrastructure
REDIS_PASSWORD=<redis-password>
GRAFANA_PASSWORD=<grafana-admin-password>

# External Services
SONAR_TOKEN=<sonarcloud-token>
SLACK_WEBHOOK=<slack-webhook-url>

# Deployment
STAGING_HOST=staging.grubsy.com
PRODUCTION_HOST=grubsy.com
DOCKER_REGISTRY=ghcr.io
```

## Testing Strategy

### 1. Unit Testing

**Backend (Jest)**
- Controller tests
- Service layer tests
- Utility function tests
- Mock external dependencies

**Mobile Apps (Jest + React Native Testing Library)**
- Component tests
- Hook tests
- Service tests
- Navigation tests

### 2. Integration Testing

**API Integration Tests**
- Full CRUD operations
- Authentication flows
- WebSocket connections
- Error handling scenarios

### 3. End-to-End Testing

**Playwright Tests**
- Complete user workflows
- Cross-browser compatibility
- Mobile viewport testing
- API contract testing

### 4. Performance Testing

**K6 Load Tests**
- Gradual load increase
- Peak load simulation
- Stress testing
- Endurance testing

## Deployment Strategies

### Staging Deployment

**Trigger**: Push to `develop` branch

**Process**:
1. Run full CI pipeline
2. Build and push Docker images
3. Deploy to staging environment
4. Run smoke tests
5. Send notification

**Features**:
- Automatic deployment
- Quick rollback capability
- Integration with monitoring tools

### Production Deployment

**Trigger**: Push to `main` branch or manual dispatch

**Process**:
1. Run full CI pipeline
2. Security and quality gates
3. Build and push production images
4. Blue-green deployment strategy
5. Canary release (10% traffic)
6. Monitor canary for 5 minutes
7. Full deployment (100% traffic)
8. Post-deployment verification
9. Update monitoring dashboards

**Safety Features**:
- Manual approval required
- Comprehensive backup creation
- Automatic rollback on failure
- Peak hour deployment warnings
- Multi-stage health checks

## Monitoring and Observability

### Application Monitoring

**Prometheus Metrics**:
- Request rates and latencies
- Error rates
- Business metrics
- Infrastructure metrics

**Grafana Dashboards**:
- Application performance
- Infrastructure health
- Business KPIs
- Alert management

### Logging

**Centralized Logging (Loki)**:
- Application logs
- Access logs
- Error logs
- Audit logs

**Log Aggregation (Promtail)**:
- Real-time log collection
- Log parsing and labeling
- Multi-environment support

### Alerting

**Alert Conditions**:
- High error rates (>5%)
- Slow response times (>500ms p95)
- Infrastructure issues
- Deployment failures

**Notification Channels**:
- Slack integration
- Email alerts
- PagerDuty (for critical alerts)

## Security Measures

### Code Security

1. **Static Analysis**
   - Semgrep security rules
   - ESLint security plugins
   - SonarCloud security hotspots

2. **Dependency Security**
   - Automated vulnerability scanning
   - Regular dependency updates
   - License compliance checking

3. **Container Security**
   - Base image vulnerability scanning
   - Multi-stage builds
   - Non-root user execution
   - Minimal attack surface

### Infrastructure Security

1. **Network Security**
   - Private networks for services
   - TLS encryption for all communications
   - Firewall rules and access controls

2. **Secrets Management**
   - GitHub Secrets for CI/CD
   - Environment-specific configurations
   - Rotation policies for sensitive data

## Rollback Procedures

### Automatic Rollback

Triggered automatically when:
- Health checks fail after deployment
- Error rates exceed thresholds
- Performance degradation detected

### Manual Rollback

Emergency rollback script: `scripts/rollback.sh`

**Usage**:
```bash
# Rollback production to last known good version
./scripts/rollback.sh production

# Rollback to specific version
./scripts/rollback.sh production v1.2.3
```

**Features**:
- Zero-downtime rollback
- Automatic backup creation
- Health verification
- Notification system

## Performance Optimization

### Build Optimization

1. **Docker Multi-stage Builds**
   - Smaller production images
   - Cached layer optimization
   - Security-focused final stage

2. **Dependency Management**
   - Production-only dependencies
   - Package deduplication
   - Vulnerability-free packages

### Runtime Optimization

1. **Resource Management**
   - CPU and memory limits
   - Horizontal scaling capabilities
   - Load balancing

2. **Caching Strategy**
   - Redis for session management
   - CDN for static assets
   - Database query optimization

## Troubleshooting Guide

### Common Issues

1. **Build Failures**
   - Check dependency versions
   - Verify environment variables
   - Review test failures

2. **Deployment Issues**
   - Verify image availability
   - Check health endpoints
   - Review container logs

3. **Performance Problems**
   - Monitor resource usage
   - Check database connections
   - Review application metrics

### Debug Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View application logs
docker-compose -f docker-compose.prod.yml logs grubsy-backend

# Check resource usage
docker stats

# Run health checks
curl -f https://grubsy.com/health
```

## Maintenance Procedures

### Regular Maintenance

1. **Weekly Tasks**
   - Review security alerts
   - Update dependencies
   - Clean up old Docker images
   - Review performance metrics

2. **Monthly Tasks**
   - Security audit
   - Performance optimization review
   - Backup verification
   - Documentation updates

### Emergency Procedures

1. **Service Outage**
   - Check monitoring dashboards
   - Review recent deployments
   - Execute rollback if necessary
   - Communicate with stakeholders

2. **Security Incident**
   - Isolate affected systems
   - Review access logs
   - Apply security patches
   - Conduct post-incident review

## Best Practices

### Development

1. **Code Quality**
   - Follow ESLint rules
   - Write comprehensive tests
   - Use meaningful commit messages
   - Regular code reviews

2. **Security**
   - Never commit secrets
   - Use environment variables
   - Regular dependency updates
   - Follow OWASP guidelines

### Operations

1. **Monitoring**
   - Set up meaningful alerts
   - Regular dashboard reviews
   - Proactive issue resolution
   - Performance trend analysis

2. **Deployment**
   - Test in staging first
   - Deploy during low-traffic periods
   - Monitor post-deployment
   - Have rollback plan ready

## Contact Information

**DevOps Team**: devops@grubsy.com
**On-call Engineer**: +1-555-DEVOPS
**Slack Channel**: #grubsy-devops

## Additional Resources

- [Docker Documentation](./DOCKER.md)
- [Monitoring Setup](./MONITORING.md)
- [Security Guidelines](./SECURITY.md)
- [API Documentation](./API.md)