# ORACLE-LEDGER Stripe Integration - Deployment Guide

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Environment Setup](#environment-setup)
3. [Stripe Account Configuration](#stripe-account-configuration)
4. [Database Deployment](#database-deployment)
5. [Application Deployment](#application-deployment)
6. [Security Configuration](#security-configuration)
7. [SSL and Production Setup](#ssl-and-production-setup)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
10. [Production Deployment Checklist](#production-deployment-checklist)

---

## System Requirements

### Minimum Hardware Requirements

#### Development Environment
- **CPU**: 2 cores (Intel i5/AMD Ryzen 5 or equivalent)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB available disk space
- **Network**: Broadband internet connection

#### Production Environment
- **CPU**: 4 cores minimum (Intel Xeon/AMD EPYC or equivalent)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB SSD minimum, 100GB+ recommended
- **Network**: Dedicated internet connection with static IP

### Software Requirements

#### Runtime Environment
- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 10.0.0 or higher
- **PostgreSQL**: Version 14.0 or higher (16+ recommended)
- **Operating System**: Linux (Ubuntu 20.04+), Windows Server 2019+, or macOS 12+

#### Dependencies and Libraries

**Production Dependencies:**
```json
{
  "express": "^5.1.0",
  "stripe": "^16.8.0",
  "drizzle-orm": "^0.44.5",
  "@neondatabase/serverless": "^1.0.1",
  "react": "^19.1.1",
  "ws": "^8.18.3"
}
```

**Development Dependencies:**
```json
{
  "typescript": "~5.8.2",
  "tsx": "^4.20.5",
  "hardhat": "^2.22.6",
  "concurrently": "^9.2.1"
}
```

### Third-Party Service Requirements

#### Database Hosting Options
1. **Neon Database** (Recommended)
   - Free tier available
   - Auto-scaling
   - Built-in backups
   - URL: https://neon.tech

2. **Supabase**
   - Free tier available
   - Built-in authentication
   - Real-time features
   - URL: https://supabase.com

3. **AWS RDS PostgreSQL**
   - Production-grade
   - Multi-AZ deployment
   - Automated backups
   - URL: https://aws.amazon.com/rds/

#### Cloud Infrastructure Options
1. **DigitalOcean App Platform**
2. **Vercel** (Frontend only)
3. **AWS Elastic Beanstalk**
4. **Google Cloud Run**
5. **Azure App Service**

---

## Environment Setup

### 1. Development Environment

#### Step 1: Install Prerequisites

**Install Node.js (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

**Install Node.js (macOS):**
```bash
# Using Homebrew
brew install node@20

# Verify installation
node --version
npm --version
```

**Install Node.js (Windows):**
- Download installer from: https://nodejs.org/
- Run installer as Administrator
- Verify installation in Command Prompt

#### Step 2: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

**macOS:**
```bash
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16

# Verify installation
psql --version
```

**Windows:**
- Download installer from: https://www.postgresql.org/download/windows/
- Run installer with default settings
- Note the password set during installation

#### Step 3: Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE oracle_ledger;
CREATE USER ledger_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE oracle_ledger TO ledger_user;

# Exit psql
\q
```

### 2. Staging Environment

#### Container Deployment with Docker

**Create Dockerfile:**
```dockerfile
# Use Node.js 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Install dependencies
RUN npm run db:push

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "dev:backend"]
```

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  oracle-ledger:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://ledger_user:password@db:5432/oracle_ledger
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - API_PORT=3001
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=oracle_ledger
      - POSTGRES_USER=ledger_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-schema-stripe.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## Stripe Account Configuration

### 1. Create Stripe Account

#### Production Account Setup
1. **Visit Stripe Dashboard**: https://dashboard.stripe.com/register
2. **Complete Registration**:
   - Business information
   - Contact details
   - Tax identification
   - Bank account details

3. **Account Verification Process**:
   - Business license upload
   - Beneficial ownership information
   - Director information
   - Banking details verification

#### Account Settings Configuration

**Business Settings:**
- Business profile completion
- Customer-facing business name
- Support contact information
- Public business details

**Payment Settings:**
- Accepted payment methods:
  - Credit/debit cards
  - ACH Direct Debit (for payments)
  - ACH Direct Deposit (for payouts)

### 2. API Key Configuration

#### Retrieve API Keys
1. **Login to Stripe Dashboard**
2. **Navigate to Developers → API Keys**
3. **Copy API Keys**:
   - **Publishable Key**: Used in frontend applications
   - **Secret Key**: Used in backend applications

#### Environment Variable Setup
```bash
# Development (.env.development)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Staging (.env.staging)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Production (.env.production)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### 3. Webhook Configuration

#### Create Webhook Endpoint
1. **Navigate to Developers → Webhooks**
2. **Add endpoint**: `https://yourdomain.com/api/stripe/webhooks`
3. **Select Events**:
   ```
   customer.created
   customer.updated
   payment_method.attached
   charge.succeeded
   charge.failed
   payment_intent.succeeded
   payment_intent.payment_failed
   payout.paid
   payout.failed
   account.updated
   ```

#### Webhook Security
```javascript
// Webhook signing secret configuration
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Verify webhook signature
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
```

### 4. ACH Payment Configuration

#### Enable ACH Payments
1. **In Stripe Dashboard**:
   - Go to Settings → Payment methods
   - Enable "ACH Direct Debit"
   - Configure ACH return codes
   - Set settlement timing

#### ACH Compliance Settings
```javascript
// ACH compliance configuration
const achConfig = {
  classCode: 'PPD', // Prearranged Payments and Deposits
  companyName: 'Your Company Name',
  companyIdentification: '123456789',
  settlementDays: 3,
  returnCodes: ['R01', 'R02', 'R03', 'R04', 'R05']
};
```

### 5. Direct Deposit Configuration

#### Stripe Connect Setup
1. **Enable Stripe Connect**:
   - Go to Connect → Settings
   - Enable Connect for your platform
   - Configure payout schedule

2. **Verification Requirements**:
   - Identity verification
   - Business verification
   - Bank account verification

#### Compliance Documentation
- **Form I-9**: Employment eligibility
- **Form W-9**: Tax information (contractors)
- **Direct deposit authorization forms**
- **State withholding forms**

---

## Database Deployment

### 1. Schema Deployment

#### Initial Database Setup
```bash
# Connect to database
psql postgresql://user:password@host:5432/database

# Run initial schema
\i database-schema.sql

# Run Stripe-specific schema
\i database-schema-stripe.sql

# Run fee tracking schema
\i database-schema-fee-tracking.sql
```

#### Migration Strategy
```javascript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Run Migrations:**
```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:push

# For production, use migrations:
npm run db:migrate
```

### 2. Database Optimization

#### Performance Tuning
```sql
-- Connection pool settings
SET max_connections = 100;
SET shared_buffers = '256MB';
SET effective_cache_size = '1GB';
SET maintenance_work_mem = '64MB';
SET checkpoint_completion_target = 0.9;
SET wal_buffers = '16MB';
SET default_statistics_target = 100;
SET random_page_cost = 1.1;
SET effective_io_concurrency = 200;
```

#### Index Optimization
```sql
-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_ach_payments_customer_status_date 
ON ach_payments(customer_id, status, scheduled_date);

CREATE INDEX CONCURRENTLY idx_customers_oracle_ledger_active 
ON customers(customer_id, active) WHERE active = true;

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_payment_methods_active_default 
ON payment_methods(customer_id, is_default) 
WHERE status = 'active' AND deleted_at IS NULL;
```

### 3. Backup Strategy

#### Automated Backups
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/oracle-ledger"
DATABASE_URL="postgresql://user:password@host:5432/oracle_ledger"

# Create backup
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/oracle_ledger_$DATE.sql.gz"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "oracle_ledger_*.sql.gz" -mtime +30 -delete

echo "Backup completed: oracle_ledger_$DATE.sql.gz"
```

#### Point-in-Time Recovery
```bash
# Base backup
pg_basebackup -D /backup/base -Ft -z -P

# WAL archiving
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

---

## Application Deployment

### 1. Build Configuration

#### Production Build
```bash
# Install production dependencies
npm ci --only=production

# Build frontend
npm run build

# Verify build
ls -la dist/
```

#### Environment-Specific Builds
```json
{
  "scripts": {
    "build:dev": "NODE_ENV=development npm run build",
    "build:staging": "NODE_ENV=staging npm run build",
    "build:prod": "NODE_ENV=production npm run build"
  }
}
```

### 2. Application Server Setup

#### PM2 Process Manager
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'oracle-ledger-api',
    script: 'server/api.ts',
    interpreter: 'tsx',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: process.env.DATABASE_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
    },
    error_file: '/var/log/oracle-ledger/api-error.log',
    out_file: '/var/log/oracle-ledger/api-out.log',
    log_file: '/var/log/oracle-ledger/api-combined.log',
    time: true
  }]
};
```

#### Start Application
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Set PM2 to start on boot
pm2 startup
pm2 save

# Monitor application
pm2 monit
```

### 3. Load Balancer Configuration

#### Nginx Configuration
```nginx
upstream oracle_ledger {
    least_conn;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://oracle_ledger;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/health {
        proxy_pass http://oracle_ledger;
        access_log off;
    }
}
```

---

## Security Configuration

### 1. SSL/TLS Configuration

#### Let's Encrypt SSL
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### SSL Configuration
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

### 2. Firewall Configuration

#### UFW (Ubuntu Firewall)
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (rate limited)
sudo ufw limit ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow database connections (restrict to application servers)
sudo ufw allow from 10.0.1.0/24 to any port 5432

# Deny all other incoming traffic
sudo ufw deny incoming

# Show status
sudo ufw status verbose
```

### 3. API Security

#### Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health'
});

app.use('/api', limiter);
```

#### CORS Configuration
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://app.yourdomain.com'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-User-Email']
};

app.use(cors(corsOptions));
```

### 4. Database Security

#### Connection Security
```javascript
// database connection with SSL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('path/to/ca-certificate.crt')
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Database User Permissions
```sql
-- Create application user with limited permissions
CREATE USER oracle_ledger_app WITH PASSWORD 'secure_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE oracle_ledger TO oracle_ledger_app;
GRANT USAGE ON SCHEMA public TO oracle_ledger_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO oracle_ledger_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO oracle_ledger_app;

-- Deny superuser privileges
ALTER USER oracle_ledger_app NOSUPERUSER NOCREATEDB NOCREATEROLE;
```

---

## Monitoring and Logging

### 1. Application Monitoring

#### Health Check Endpoint
```javascript
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check Stripe API connection
    await stripe.charges.list({ limit: 1 });
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      database: 'connected',
      stripe: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

#### Metrics Collection
```javascript
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

const stripeOperationsTotal = new Counter({
  name: 'stripe_operations_total',
  help: 'Total number of Stripe operations',
  labelNames: ['operation_type', 'status']
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 2. Log Management

#### Structured Logging
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('ACH payment processed', {
  paymentId: payment.id,
  amount: payment.amount_cents,
  customerId: payment.customer_id,
  timestamp: new Date().toISOString()
});
```

#### Log Rotation
```bash
# /etc/logrotate.d/oracle-ledger
/var/log/oracle-ledger/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 oracle-ledger oracle-ledger
    postrotate
        pm2 reload oracle-ledger-api
    endscript
}
```

### 3. Performance Monitoring

#### Database Performance
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Monitor database connections
SELECT count(*) as active_connections, state 
FROM pg_stat_activity 
GROUP BY state;

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Application Performance
```javascript
// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
    
    // Alert on slow requests
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`
      });
    }
  });
  
  next();
});
```

### 4. Error Tracking

#### Error Aggregation
```javascript
import Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.errorHandler());
```

#### Alerting Configuration
```yaml
# prometheus-alerts.yml
groups:
  - name: oracle-ledger
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: DatabaseConnectionFailure
        expr: up{job="oracle-ledger-db"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
          
      - alert: StripeAPIUnreachable
        expr: up{job="stripe-health-check"} == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Stripe API unreachable"
```

---

## Backup and Disaster Recovery

### 1. Backup Strategy

#### Multi-Level Backup Approach

**Level 1: Real-time Database Replication**
```bash
# PostgreSQL streaming replication
# Primary server configuration (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

**Level 2: Automated Daily Backups**
```bash
#!/bin/bash
# backup-strategy.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/oracle-ledger"
RETENTION_DAYS=30

# Full database backup
pg_dump \
  --host=primary-db \
  --username=backup_user \
  --no-password \
  --verbose \
  --clean \
  --create \
  --format=custom \
  --file="$BACKUP_DIR/full_backup_$DATE.dump" \
  oracle_ledger

# Compress backup
gzip "$BACKUP_DIR/full_backup_$DATE.dump"

# Upload to cloud storage (AWS S3 example)
aws s3 cp "$BACKUP_DIR/full_backup_$DATE.dump.gz" \
  s3://oracle-ledger-backups/database/

# Clean up old local backups
find "$BACKUP_DIR" -name "full_backup_*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

**Level 3: Point-in-Time Recovery**
```bash
# Continuous WAL archiving
# Configure in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://oracle-ledger-wal/%f'
max_wal_senders = 10
```

### 2. Disaster Recovery Procedures

#### Recovery Time Objectives (RTO)
- **Critical Systems**: 1 hour
- **Full Application**: 4 hours
- **Database Recovery**: 2 hours

#### Recovery Point Objectives (RPO)
- **Database**: 15 minutes (with WAL archiving)
- **Application Configuration**: 24 hours
- **Log Files**: 1 hour

#### Recovery Procedures

**Database Recovery:**
```bash
#!/bin/bash
# disaster-recovery.sh

RECOVERY_TYPE=$1
BACKUP_FILE=$2

case $RECOVERY_TYPE in
  "full")
    echo "Performing full database recovery..."
    pg_restore \
      --clean \
      --create \
      --verbose \
      --host=recovery-db \
      --username=recovery_user \
      --no-password \
      "$BACKUP_FILE"
    ;;
    
  "point-in-time")
    echo "Performing point-in-time recovery..."
    # Restore from base backup
    pg_restore --clean --create --verbose "$BACKUP_FILE"
    
    # Apply WAL files to specific timestamp
    pg_ctl stop -D /var/lib/postgresql/data
    recovery_target_time = "$3"
    recovery_target_action = 'promote'
    pg_ctl start -D /var/lib/postgresql/data
    ;;
esac
```

### 3. Business Continuity Planning

#### Failover Procedures

**Primary to Secondary Database:**
```bash
# Promote replica to primary
sudo -u postgres pg_ctl promote -D /var/lib/postgresql/data

# Update application connection strings
# DATABASE_URL should point to new primary

# Restart application services
pm2 restart oracle-ledger-api
```

**Application Server Failover:**
```bash
# Load balancer configuration update
# Update nginx upstream configuration
upstream oracle_ledger {
    server 10.0.1.10:3001 weight=1 max_fails=3 fail_timeout=30s;  # Primary down
    server 10.0.1.11:3001 weight=1 max_fails=3 fail_timeout=30s;  # Secondary up
}

# Reload nginx configuration
nginx -s reload
```

### 4. Testing Recovery Procedures

#### Monthly Recovery Tests
```bash
#!/bin/bash
# recovery-test.sh

TEST_DB="oracle_ledger_recovery_test"
BACKUP_FILE=$(ls -t /backups/oracle-ledger/full_backup_*.dump.gz | head -1)

echo "Starting recovery test..."
echo "Using backup: $BACKUP_FILE"

# Create test database
createdb $TEST_DB

# Restore backup to test database
gunzip -c $BACKUP_FILE | pg_restore --dbname=$TEST_DB

# Run validation queries
psql -d $TEST_DB -c "SELECT COUNT(*) FROM customers;"
psql -d $TEST_DB -c "SELECT COUNT(*) FROM ach_payments;"
psql -d $TEST_DB -c "SELECT COUNT(*) FROM direct_deposit_payouts;"

# Cleanup
dropdb $TEST_DB

echo "Recovery test completed successfully"
```

---

## Production Deployment Checklist

### Pre-Deployment Checklist

#### Environment Preparation
- [ ] Production server provisioned and configured
- [ ] SSL certificates obtained and installed
- [ ] Domain name configured and DNS propagated
- [ ] Firewall rules configured and tested
- [ ] Database server provisioned and secured
- [ ] Backup systems configured and tested

#### Security Configuration
- [ ] Strong passwords for all accounts
- [ ] SSH key-based authentication configured
- [ ] Database users with minimal required permissions
- [ ] Environment variables secured
- [ ] API keys rotated and secured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation implemented
- [ ] SQL injection protection verified

#### Application Configuration
- [ ] Production environment variables set
- [ ] Database migrations applied
- [ ] Static assets built and optimized
- [ ] Health check endpoints configured
- [ ] Logging configured with appropriate levels
- [ ] Monitoring and alerting setup
- [ ] CDN configured for static assets

#### Performance Optimization
- [ ] Database indexes optimized
- [ ] Query performance verified
- [ ] Application performance testing completed
- [ ] Load testing completed
- [ ] Memory usage optimized
- [ ] Connection pooling configured

#### Compliance and Auditing
- [ ] PCI DSS compliance verified
- [ ] NACHA compliance for ACH transactions
- [ ] Audit logging enabled and configured
- [ ] Data retention policies configured
- [ ] Privacy policy updated
- [ ] Terms of service updated

### Deployment Process

#### Step 1: Infrastructure Setup
```bash
# Server preparation
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx

# Create application user
sudo useradd -m -s /bin/bash oracle-ledger
sudo mkdir -p /opt/oracle-ledger
sudo chown oracle-ledger:oracle-ledger /opt/oracle-ledger
```

#### Step 2: Application Deployment
```bash
# Switch to application user
sudo -iu oracle-ledger

# Clone application
cd /opt/oracle-ledger
git clone https://github.com/your-org/oracle-ledger.git .

# Install dependencies
npm ci --only=production

# Build application
npm run build:prod

# Configure environment
cp .env.production .env

# Apply database migrations
npm run db:push
```

#### Step 3: Service Configuration
```bash
# Configure PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Configure Nginx
sudo cp nginx-production.conf /etc/nginx/sites-available/oracle-ledger
sudo ln -s /etc/nginx/sites-available/oracle-ledger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Enable services
sudo systemctl enable postgresql
sudo systemctl enable nginx
sudo systemctl start postgresql
sudo systemctl start nginx
```

#### Step 4: SSL/TLS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Step 5: Monitoring Setup
```bash
# Install monitoring agents
sudo apt install prometheus-node-exporter

# Configure log rotation
sudo cp logrotate.conf /etc/logrotate.d/oracle-ledger

# Setup backup cron job
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /opt/oracle-ledger/scripts/backup-strategy.sh") | sudo crontab -
```

### Post-Deployment Verification

#### Functional Testing
```bash
# Test health endpoints
curl -f http://localhost:3001/api/health

# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Test Stripe connectivity
curl -X POST http://localhost:3001/api/stripe/test

# Test payment processing (sandbox)
curl -X POST http://localhost:3001/api/stripe/test-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "usd"}'
```

#### Performance Testing
```bash
# Load testing with Artillery
npm install -g artillery

# Run load tests
artillery run load-test.yml

# Monitor during load test
pm2 monit
```

#### Security Testing
```bash
# SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/

# Security headers test
curl -I https://yourdomain.com

# OWASP ZAP scan
# Install and run automated security scan
```

### Go-Live Checklist

#### Final Pre-Launch
- [ ] All tests passing
- [ ] Performance metrics within acceptable ranges
- [ ] Security scan completed with no critical issues
- [ ] Backup and recovery tested
- [ ] Monitoring alerts configured
- [ ] Support procedures documented
- [ ] Rollback plan prepared
- [ ] Communication plan executed

#### Launch Day
- [ ] Switch DNS to production servers
- [ ] Monitor system health closely
- [ ] Verify all integrations working
- [ ] Check error rates and performance
- [ ] Validate payment processing
- [ ] Monitor database performance
- [ ] Check backup jobs running

#### Post-Launch (24-48 hours)
- [ ] Review all metrics and logs
- [ ] Address any issues discovered
- [ ] Optimize performance if needed
- [ ] Update documentation based on learnings
- [ ] Celebrate successful deployment! 🎉

---

## Support and Contact

For deployment support and questions:

- **Documentation**: See other guides in this series
- **Issues**: Report via project issue tracker
- **Emergency**: Contact system administrator
- **Updates**: Subscribe to release notifications

**Emergency Contacts:**
- DevOps Team: devops@yourcompany.com
- Database Admin: dba@yourcompany.com
- Security Team: security@yourcompany.com

---

*This deployment guide is part of the ORACLE-LEDGER Stripe Integration documentation suite. For additional guides, see API_INTEGRATION_GUIDE.md, CONFIGURATION_GUIDE.md, TROUBLESHOOTING_GUIDE.md, and DEVELOPER_GUIDE.md.*
