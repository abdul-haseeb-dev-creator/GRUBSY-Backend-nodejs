# AWS Deployment Guide for Grubsy Backend

## 📋 Overview

This guide provides a comprehensive roadmap for deploying the Grubsy Backend to AWS. The backend is containerized and production-ready, but requires specific AWS infrastructure setup.

## 🎯 Prerequisites

### Required Before Deployment

- **AWS Account** with billing enabled
- **Domain Name** (e.g., `api.grubsy.com`) with DNS management
- **SSL Certificate** (AWS Certificate Manager or third-party)
- **Git Repository** with deployment access
- **Basic AWS Knowledge** (IAM, VPC, EC2 concepts)

### Optional but Recommended

- **AWS CLI** installed and configured
- **Docker** knowledge for troubleshooting
- **Monitoring Tools** (DataDog, New Relic, or AWS-native)

## 🏗️ Required AWS Infrastructure

### Core Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **VPC** | Network isolation | 2-3 AZs, public/private subnets |
| **RDS MySQL** | Database | db.t3.micro → db.t3.small (production) |
| **ElastiCache Redis** | Caching & sessions | cache.t3.micro → cache.t3.small |
| **S3** | File storage | Standard tier, versioning enabled |
| **EC2/ECS** | Application hosting | t3.micro → t3.small (start small) |
| **Application Load Balancer** | Traffic distribution | With health checks |
| **CloudFront** (Optional) | CDN for static assets | For uploaded images |

### Security & Access Management

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **IAM** | Access control | Least-privilege roles |
| **Security Groups** | Network firewall | Restrict ports/protocols |
| **AWS WAF** (Recommended) | Web application firewall | Rate limiting, SQL injection protection |
| **AWS Shield** (Optional) | DDoS protection | Standard (free) or Advanced |
| **AWS Config** (Optional) | Compliance monitoring | Resource configuration tracking |

### Monitoring & Logging

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **CloudWatch** | Metrics & logs | Alarms, dashboards |
| **AWS X-Ray** (Optional) | Distributed tracing | Performance monitoring |
| **CloudTrail** | API auditing | Security monitoring |

## 💰 Cost Breakdown

### Monthly Cost Estimates (us-east-1)

#### Minimum Production Setup (~$50-80/month)
```
EC2 t3.micro (730 hours)          $8.50
RDS MySQL db.t3.micro            $15.00
ElastiCache Redis cache.t3.micro $15.00
S3 Standard (10GB)               $0.25
ALB (1 LCU)                      $16.00
CloudWatch Logs (5GB)            $0.50
Data Transfer (100GB)            $9.00
SSL Certificate (ACM)            FREE
----------
Total: ~$64.25/month
```

#### Recommended Production Setup (~$150-250/month)
```
EC2 t3.small (730 hours)          $17.00
RDS MySQL db.t3.small            $30.00
ElastiCache Redis cache.t3.small $30.00
S3 Standard (50GB)               $1.25
ALB (2 LCUs)                     $32.00
CloudWatch Logs (20GB)           $2.00
Data Transfer (500GB)            $45.00
Route 53 (1 hosted zone)         $0.50
AWS WAF (basic)                  $5.00
----------
Total: ~$162.75/month
```

#### Enterprise Setup (~$500-1000/month)
```
ECS Fargate (0.25 vCPU, 0.5GB)   $100.00
RDS MySQL db.t3.medium           $120.00
ElastiCache Redis cache.t3.small $30.00
Multi-AZ RDS (backup)           +$120.00
CloudFront (1TB transfer)        $85.00
AWS WAF Advanced                 $75.00
AWS Shield Advanced              $3000/year (~$250/month)
----------
Total: ~$730/month (first year)
```

### Cost Optimization Tips

- **Reserved Instances**: 1-year RI saves 30-40%
- **Spot Instances**: For dev/staging environments
- **Auto Scaling**: Scale down during off-peak hours
- **S3 Lifecycle**: Move old files to cheaper storage
- **CloudWatch**: Set up billing alerts

## 🚀 Deployment Steps

### Phase 1: Infrastructure Setup

#### 1. Create VPC and Networking
```bash
# Using AWS CLI (or Console)
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-xxxxx --internet-gateway-id igw-xxxxx
```

#### 2. Set up RDS MySQL
```bash
aws rds create-db-instance \
  --db-instance-identifier grubsy-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name grubsy-db-subnet
```

#### 3. Set up ElastiCache Redis
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id grubsy-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --vpc-security-group-ids sg-xxxxx \
  --cache-subnet-group-name grubsy-redis-subnet
```

#### 4. Create S3 Bucket
```bash
aws s3 mb s3://grubsy-uploads --region us-east-1
aws s3api put-bucket-versioning \
  --bucket grubsy-uploads \
  --versioning-configuration Status=Enabled
```

#### 5. Set up SSL Certificate
```bash
# Using AWS Certificate Manager
aws acm request-certificate \
  --domain-name api.grubsy.com \
  --validation-method DNS
```

### Phase 2: Application Deployment

#### Option A: EC2 Deployment

1. **Launch EC2 Instance**
```bash
aws ec2 run-instances \
  --image-id ami-xxxxx \
  --count 1 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx
```

2. **Install Docker and Deploy**
```bash
# SSH into EC2 instance
sudo yum update -y
sudo amazon-linux-extras install docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Clone and deploy
git clone https://github.com/your-org/grubsy-backend.git
cd grubsy-backend
cp .env.production .env
# Edit .env with AWS endpoints

docker-compose up -d
docker-compose exec grubsy-backend npx prisma migrate deploy
```

#### Option B: ECS Fargate Deployment (Recommended)

1. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name grubsy-backend
```

2. **Create Task Definition**
```yaml
# task-definition.json
{
  "family": "grubsy-backend",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [{
    "name": "grubsy-backend",
    "image": "your-registry/grubsy-backend:latest",
    "essential": true,
    "portMappings": [{"containerPort": 3000}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "DATABASE_URL", "value": "mysql://..."},
      // ... other env vars
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/grubsy-backend",
        "awslogs-region": "us-east-1"
      }
    }
  }]
}
```

3. **Deploy Service**
```bash
aws ecs create-service \
  --cluster grubsy-backend \
  --service-name grubsy-backend-service \
  --task-definition grubsy-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx]}"
```

### Phase 3: Load Balancing & DNS

#### 1. Create Application Load Balancer
```bash
aws elbv2 create-load-balancer \
  --name grubsy-backend-alb \
  --subnets subnet-xxxxx subnet-yyyy \
  --security-groups sg-xxxxx
```

#### 2. Configure Target Group
```bash
aws elbv2 create-target-group \
  --name grubsy-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health
```

#### 3. Create Listener
```bash
aws elbv2 create-listener \
  --load-balancer-arn alb-arn \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=cert-arn \
  --default-actions Type=forward,TargetGroupArn=tg-arn
```

#### 4. Configure DNS
```bash
# Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.grubsy.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "dualstack.alb-dns-name",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Production Environment
NODE_ENV=production
PORT=3000

# Database (AWS RDS)
DATABASE_URL=mysql://username:password@grubsy-db.xxxxx.rds.amazonaws.com:3306/grubsy?connection_limit=20&pool_timeout=60&connect_timeout=60

# Redis (AWS ElastiCache)
REDIS_URL=redis://grubsy-redis.xxxxx.cache.amazonaws.com:6379

# JWT Configuration
JWT_SECRET=your-32-char-secret-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=https://grubsy.com,https://www.grubsy.com,https://app.grubsy.com

# Base URL for API
BASE_URL=https://api.grubsy.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-key

# AWS S3 Configuration (if using S3 for uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=grubsy-uploads
AWS_REGION=us-east-1
```

### Environment-Specific Configurations

- **Development**: Use local Docker containers
- **Staging**: Smaller instance sizes, single AZ
- **Production**: Multi-AZ, larger instances, full monitoring

## 🔒 Security Considerations

### Network Security

1. **VPC Design**
   - Public subnets for ALB
   - Private subnets for application and database
   - NAT Gateway for outbound traffic from private subnets

2. **Security Groups**
   - ALB: Allow 80/443 from 0.0.0.0/0
   - EC2/ECS: Allow 3000 from ALB security group only
   - RDS: Allow 3306 from application security group only
   - Redis: Allow 6379 from application security group only

3. **IAM Roles**
   - EC2 instance role with minimal permissions
   - ECS task execution role for container registry access
   - S3 bucket policies for upload access

### Application Security

1. **SSL/TLS**
   - Use AWS Certificate Manager for free certificates
   - Redirect HTTP to HTTPS
   - Enable HSTS headers

2. **Web Application Firewall**
   - AWS WAF with OWASP Core Rule Set
   - Rate limiting for API endpoints
   - SQL injection and XSS protection

3. **Secrets Management**
   - Use AWS Secrets Manager for sensitive data
   - Rotate credentials regularly
   - Never store secrets in environment variables

## 📊 Monitoring & Observability

### CloudWatch Setup

1. **Application Metrics**
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "HighCPU" \
  --alarm-description "CPU usage above 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value=i-xxxxx
```

2. **Health Check Monitoring**
   - ALB health checks every 30 seconds
   - Application health endpoint monitoring
   - Database connection monitoring

3. **Log Aggregation**
   - CloudWatch Logs for application logs
   - Structured logging with Winston
   - Log retention policies (30-90 days)

### Alerting Strategy

- **Critical**: Database down, application unresponsive
- **Warning**: High CPU/memory, slow response times
- **Info**: Deployment events, scaling activities

## 🔄 Backup & Disaster Recovery

### Database Backups

1. **Automated Backups**
```bash
aws rds modify-db-instance \
  --db-instance-identifier grubsy-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

2. **Manual Snapshots**
```bash
aws rds create-db-snapshot \
  --db-instance-identifier grubsy-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

### Application Backups

- **Code**: Git repository with tags
- **Configuration**: Infrastructure as Code (CloudFormation/Terraform)
- **User Data**: S3 versioning for uploaded files

### Disaster Recovery

- **Multi-AZ Deployment**: Automatic failover
- **Backup Regions**: Cross-region replication for critical data
- **Recovery Time Objective (RTO)**: < 1 hour
- **Recovery Point Objective (RPO)**: < 5 minutes

## 📈 Scaling & Performance

### Horizontal Scaling

1. **ECS Auto Scaling**
```bash
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling \
  --service-namespace ecs \
  --resource-id service/grubsy-backend/grubsy-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

2. **RDS Read Replicas**
```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier grubsy-db-replica \
  --source-db-instance-identifier grubsy-db
```

### Performance Optimization

- **Database**: Connection pooling, query optimization
- **Caching**: Redis for session and API response caching
- **CDN**: CloudFront for static asset delivery
- **Compression**: Gzip compression for API responses

## 🛠️ Troubleshooting

### Common Issues

1. **Application Won't Start**
   - Check environment variables
   - Verify database connectivity
   - Check CloudWatch logs

2. **Database Connection Issues**
   - Verify security group rules
   - Check RDS instance status
   - Validate connection string

3. **High Latency**
   - Check CloudWatch metrics
   - Monitor database performance
   - Review application logs

4. **SSL Certificate Issues**
   - Verify domain ownership
   - Check certificate expiry
   - Validate DNS configuration

### Debugging Tools

- **AWS CLI**: Infrastructure inspection
- **CloudWatch Logs**: Application debugging
- **X-Ray**: Performance tracing
- **EC2 Instance Connect**: Direct server access

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] AWS account configured with billing alerts
- [ ] Domain purchased and DNS configured
- [ ] SSL certificate requested and validated
- [ ] Git repository accessible from deployment environment

### Infrastructure Setup
- [ ] VPC created with public/private subnets
- [ ] RDS MySQL instance running and accessible
- [ ] ElastiCache Redis cluster operational
- [ ] S3 bucket created with proper permissions
- [ ] Security groups configured correctly
- [ ] IAM roles created with minimal permissions

### Application Deployment
- [ ] Docker image built and pushed to registry
- [ ] Environment variables configured
- [ ] ECS service or EC2 instance running
- [ ] Application Load Balancer configured
- [ ] Health checks passing
- [ ] DNS records pointing to ALB

### Security & Monitoring
- [ ] SSL/TLS properly configured
- [ ] WAF rules active
- [ ] CloudWatch alarms set up
- [ ] Log aggregation working
- [ ] Backup strategy implemented

### Testing & Validation
- [ ] Application accessible via domain
- [ ] API endpoints responding correctly
- [ ] Database migrations completed
- [ ] File uploads working
- [ ] WebSocket connections functional

## 🎯 Next Steps

1. **Start Small**: Begin with t3.micro instances and scale up as needed
2. **Monitor Costs**: Set up billing alerts and review monthly usage
3. **Implement CI/CD**: Automate deployments with GitHub Actions or CodePipeline
4. **Add Monitoring**: Implement comprehensive observability
5. **Plan for Scale**: Design for horizontal scaling from day one

## 📞 Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **AWS Support**: Business/Enterprise support for production workloads
- **AWS Well-Architected Framework**: Best practices guide
- **AWS Cost Calculator**: https://calculator.aws/

---

**Total Setup Time**: 4-8 hours for first deployment
**Monthly Cost**: $50-250 depending on scale
**Maintenance**: 2-4 hours/month for monitoring and updates