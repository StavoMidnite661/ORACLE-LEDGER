# ORACLE-LEDGER Stripe Integration - Configuration Guide

## 📋 Table of Contents

1. [Configuration Overview](#configuration-overview)
2. [Environment Variables](#environment-variables)
3. [Stripe Configuration](#stripe-configuration)
4. [Database Configuration](#database-configuration)
5. [Security Settings](#security-settings)
6. [Monitoring Configuration](#monitoring-configuration)
7. [Backup Configuration](#backup-configuration)
8. [Integration Configuration](#integration-configuration)
9. [Performance Tuning](#performance-tuning)
10. [Compliance Configuration](#compliance-configuration)

---

## Configuration Overview

ORACLE-LEDGER Stripe integration uses a hierarchical configuration system:

1. **Environment Variables** - Primary configuration source
2. **Configuration Files** - Application-specific settings
3. **Database Configuration** - Dynamic settings
4. **Runtime Configuration** - Feature flags and toggles

### Configuration Hierarchy

```
Production Environment
├── .env.production (highest priority)
├── Environment variables
├── Database-stored settings
└── Default values (lowest priority)
```

### Configuration Validation

All configuration is validated at startup:

```javascript
// Configuration validation
const configSchema = {
  STRIPE_SECRET_KEY: { required: true, format: 'string' },
  DATABASE_URL: { required: true, format: 'url' },
  API_PORT: { required: false, format: 'port', default: 3001 },
  NODE_ENV: { required: true, enum: ['development', 'staging', 'production'] }
};
```

---

## Environment Variables

### Required Variables

#### Database Configuration
```bash
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://oracle_ledger:secure_password@localhost:5432/oracle_ledger

# For cloud databases (Neon example):
DATABASE_URL=postgresql://oracle_ledger:password@ep-mushy-12345.us-east-1.aws.neon.tech/oracle_ledger?sslmode=require

# For cloud databases (Supabase example):
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

#### Stripe Configuration
```bash
# Stripe API keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_PUBLISHABLE_KEY=pk_live_51...  # Frontend (public)
STRIPE_SECRET_KEY=sk_live_51...       # Backend (private)
STRIPE_WEBHOOK_SECRET=whsec_...       # Webhook signature verification

# For development/testing:
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Optional Variables

#### Server Configuration
```bash
# Application ports
API_PORT=3001                 # Backend API server port
PORT=5000                     # Frontend development server port

# Server settings
NODE_ENV=production           # Environment (development, staging, production)
HOST=0.0.0.0                  # Server bind address
API_PREFIX=/api               # API URL prefix

# CORS settings
CORS_ORIGIN=https://yourdomain.com  # Allowed origins (comma-separated)
CORS_CREDENTIALS=true               # Allow credentials
```

#### Security Configuration
```bash
# JWT configuration
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes in milliseconds
RATE_LIMIT_MAX=100             # Max requests per window
RATE_LIMIT_SKIP_FAILED_REQUESTS=true

# Session configuration
SESSION_SECRET=your-session-secret
SESSION_TIMEOUT=3600000        # 1 hour in milliseconds
```

#### Logging Configuration
```bash
# Log levels: error, warn, info, debug
LOG_LEVEL=info

# Log destinations
LOG_FILE_PATH=/var/log/oracle-ledger/application.log
LOG_ERROR_PATH=/var/log/oracle-ledger/error.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=30

# Structured logging
LOG_FORMAT=json                # json or simple
LOG_INCLUDE_TIMESTAMP=true
LOG_INCLUDE_LEVEL=true
LOG_INCLUDE_MESSAGE=true
```

#### Monitoring Configuration
```bash
# Health check configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000    # 30 seconds in milliseconds

# Metrics configuration
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics

# Alerting configuration
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_SMTP_HOST=smtp.yourdomain.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USERNAME=alerts@yourdomain.com
ALERT_EMAIL_PASSWORD=your-email-password
ALERT_EMAIL_RECIPIENTS=admin@yourdomain.com,ops@yourdomain.com
```

#### Backup Configuration
```bash
# Database backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *      # Daily at 2 AM (cron format)
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=oracle-ledger-backups
BACKUP_S3_REGION=us-east-1
BACKUP_S3_ACCESS_KEY=your-access-key
BACKUP_S3_SECRET_KEY=your-secret-key

# File backup
FILE_BACKUP_ENABLED=true
FILE_BACKUP_SCHEDULE=0 1 * * *  # Daily at 1 AM
FILE_BACKUP_RETENTION_DAYS=7
```

#### Redis Configuration (Caching)
```bash
# Redis cache
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_TTL=3600                 # Default TTL in seconds

# Cache configuration
CACHE_TTL_CUSTOMERS=300        # 5 minutes
CACHE_TTL_PAYMENTS=60          # 1 minute
CACHE_TTL_STATISTICS=1800      # 30 minutes
```

#### Email Configuration
```bash
# SMTP settings
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false              # true for 465, false for other ports
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password

# Email templates
EMAIL_FROM_NAME=ORACLE-LEDGER
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_SUPPORT_ADDRESS=support@yourdomain.com
```

#### External Service Configuration
```bash
# Google Services
GOOGLE_AI_API_KEY=your-gemini-api-key

# Sentry (Error Tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# DataDog (Monitoring)
DATADOG_API_KEY=your-datadog-api-key
DATADOG_SERVICE_NAME=oracle-ledger-api

# New Relic (Performance Monitoring)
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
NEW_RELIC_APP_NAME=Oracle Ledger API
```

### Development-Specific Variables

```bash
# Development environment
NODE_ENV=development
LOG_LEVEL=debug
HOT_RELOAD=true
MOCK_STRIPE=false             # Set to true to mock Stripe API

# Test database
TEST_DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/oracle_ledger_test

# Test configuration
TEST_TIMEOUT=30000
TEST_PARALLEL_LIMIT=5
```

### Production Security Variables

```bash
# SSL/TLS Configuration
SSL_CERT_PATH=/etc/ssl/certs/oracle-ledger.crt
SSL_KEY_PATH=/etc/ssl/private/oracle-ledger.key
SSL_CA_PATH=/etc/ssl/certs/ca-certificates.crt

# Certificate management
AUTO_RENEW_SSL=true
LETS_ENCRYPT_EMAIL=admin@yourdomain.com

# Firewall settings
FIREWALL_ENABLED=true
ALLOWED_IPS=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
BLOCKED_IPS=             # Comma-separated list of blocked IPs

# API Security
API_KEY_ROTATION_DAYS=90
MAX_FAILED_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=900   # 15 minutes in seconds
```

---

## Stripe Configuration

### Stripe Connect Configuration

#### Platform Settings
```javascript
// Stripe Connect configuration
const stripeConnectConfig = {
  // Business settings
  businessProfile: {
    mcc: '7372', // Merchant Category Code for Software
    name: 'Your Company Name',
    productDescription: 'Financial management and payment processing',
    supportAddress: {
      line1: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US'
    },
    supportEmail: 'support@yourdomain.com',
    supportPhone: '+1-555-123-4567',
    supportUrl: 'https://yourdomain.com/support'
  },
  
  // Capabilities
  capabilities: {
    transfers: { requested: true },
    cardPayments: { requested: true },
    taxReporting1099K: { requested: false }
  },
  
  // Payout settings
  payoutSchedule: {
    delayDays: 2,
    interval: 'daily'
  },
  
  // TOS acceptance
  tosAcceptance: {
    date: Math.floor(Date.now() / 1000),
    ip: '192.168.1.1'
  }
};
```

#### Webhook Configuration
```javascript
// Webhook settings
const webhookConfig = {
  // Enabled events
  enabledEvents: [
    'account.updated',
    'account.application.deauthorized',
    'customer.created',
    'customer.updated',
    'customer.deleted',
    'customer.source.created',
    'customer.source.deleted',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.created',
    'invoice.finalized',
    'invoice.updated',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'payment_method.attached',
    'payment_intent.created',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.succeeded',
    'charge.failed',
    'charge.refunded',
    'payout.created',
    'payout.paid',
    'payout.failed',
    'payout.canceled'
  ],
  
  // Webhook security
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  enableLogging: true,
  retryFailedWebhooks: true,
  maxRetries: 3
};
```

### Payment Method Configuration

#### ACH Payment Settings
```javascript
// ACH configuration
const achConfig = {
  // Default settings
  defaultClassCode: 'PPD', // PPD, CCD, WEB, CBP
  companyName: 'Your Company Name',
  companyIdentification: '123456789',
  
  // Verification
  verificationMethod: 'instant',
  
  // Settlement
  settlementDays: 3,
  holdFundsDays: 1,
  
  // Return codes
  enabledReturnCodes: [
    'R01', // Insufficient Funds
    'R02', // Account Closed
    'R03', // No Account/Unable to Locate Account
    'R04', // Invalid Account Number
    'R05', // Invalid Routing Number
    'R06', // Returned per ODFI Request
    'R07', // Authorization Revoked by Customer
    'R08', // Stop Payment
    'R09', // Uncollected Funds
    'R10', // Customer Advises Not Authorized
    'R11', // Check Returned - Inspect Item
    'R12', // Beneficiary or Account Holder Deceased
    'R13', // Invalid ACH Routing Number
    'R14', // Representative Payee Deceased or Unable to Continue
    'R15', // Beneficiary/Payee Deceased
    'R16', // Account Frozen
    'R17', // Record Entered In Error
    'R18', // Duplicate Payment
    'R19', // Improper Payment
    'R20', // Non-Participant in NACHA Program
    'R21', // Invalid Company ID Number
    'R22', // Invalid Individual ID Number
    'R23', // Payment Stopped
    'R24', // Duplicate Entry
    'R25', // Addenda Error
    'R26', // Permitted Return
    'R27', // Trace Number Error
    'R28', // Invalid Foreign Receiving DFI Identification
    'R29', // Corporate Customer Advises Not Authorized
    'R30', // Permitted Return (QDX RCODE)
    'R31', // Returned per Receiver's Request
    'R32', // Receiver's Bank Does Not Participate
    'R33', // Returned XCK
    'R34', // Limited Participation DFI
    'R35', // Returned Improper Entry
    'R36', // Returned per ODFI Request
    'R37', // Success No Return
    'R38', // Stop Payment on Account
    'R39', // Improper Source Document/Entry
    'R40', // Returned per RFC 4375
    'R41', // Invalid Transaction Code
    'R42', // RFC 4375 Check Truncation
    'R43', // RFC 4375 Return
    'R44', // Bank Out of Balance Return
    'R45', // Return Totals
    'R46', // Duplicate Return
    'R47', // Document Lost
    'R48', // Item Not Eligible for ARC/Slash POP Conversion
    'R49', // Corporate Terminology Mismatch
    'R50', // Permitted Return (International)
    'R51', // Permitted Return (International)
    'R52', // Stop Payment (International)
    'R53', // Permitted Return (Bill Payment)
    'R54', // Improper Delivery/Bank Error
    'R55', // Permitted Return (International)
    'R56', // Return of Improper Entry
    'R57', // Return of Improper Entry
    'R58', // Return of Improper Entry
    'R59', // Return of Improper Entry
    'R60', // Return of Improper Entry
    'R61', // Return of Improper Entry
    'R62', // Return of Improper Entry
    'R63', // Return of Improper Entry
    'R64', // Return of Improper Entry
    'R65', // Return of Improper Entry
    'R66', // Return of Improper Entry
    'R67', // Return of Improper Entry
    'R68', // Return of Improper Entry
    'R69', // Return of Improper Entry
    'R70', // Return of Improper Entry
  ],
  
  // Retry settings
  retryFailedPayments: true,
  maxRetries: 3,
  retryDelay: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};
```

#### Direct Deposit Settings
```javascript
// Direct deposit configuration
const directDepositConfig = {
  // Verification requirements
  requireIdentityVerification: true,
  requireAddressVerification: true,
  requireSSNVerification: true,
  requireBankAccountVerification: true,
  
  // Bank account verification
  verificationMethods: ['instant', 'microdeposits'],
  
  // Payout settings
  defaultPayoutSchedule: {
    delayDays: 2,
    interval: 'daily'
  },
  
  // Fee structure
  fees: {
    flatFeeCents: 25,          // $0.25 per payout
    percentageFeeBps: 50,      // 0.50% of payout amount
    minimumFeeCents: 100,      // $1.00 minimum
    maximumFeeCents: 2500      // $25.00 maximum
  },
  
  // Compliance settings
  complianceThreshold: 10000,  // $100 threshold for enhanced verification
  requireW9Form: true,         // Require W-9 for contractors
  requireI9Form: true          // Require I-9 for employees
};
```

### API Version Configuration

```javascript
// Stripe API version configuration
const stripeApiVersion = {
  apiVersion: '2024-06-20',
  
  // Feature flags
  enableConnectAccounts: true,
  enableACH: true,
  enableDirectDeposit: true,
  enable3DSecure: true,
  enablePaymentMethods: true,
  
  // Beta features
  betaFeatures: {
    financialConnections: false,
    terminal: false,
    radar: true,
    identity: true
  }
};
```

---

## Database Configuration

### Connection Pool Settings

#### PostgreSQL Configuration
```javascript
// Database connection pool configuration
const dbConfig = {
  // Connection settings
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'oracle_ledger',
  user: process.env.DB_USER || 'oracle_ledger',
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  min: 5,                      // Minimum connections
  max: 20,                     // Maximum connections
  idleTimeoutMillis: 30000,    // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if connection cannot be established
  
  // SSL configuration
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt'),
    key: fs.readFileSync('/path/to/client-key.key'),
    cert: fs.readFileSync('/path/to/client-certificate.crt')
  } : false,
  
  // Performance settings
  statement_timeout: 60000,    // 60 seconds
  query_timeout: 60000,        // 60 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};
```

#### Connection String Examples
```bash
# Local development
DATABASE_URL=postgresql://oracle_ledger:password@localhost:5432/oracle_ledger

# Neon (cloud PostgreSQL)
DATABASE_URL=postgresql://oracle_ledger:password@ep-mushy-12345.us-east-1.aws.neon.tech/oracle_ledger?sslmode=require

# AWS RDS
DATABASE_URL=postgresql://oracle_ledger:password@oracle-ledger.cf12345.us-east-1.rds.amazonaws.com:5432/oracle_ledger

# Google Cloud SQL
DATABASE_URL=postgresql://oracle_ledger:password@34.123.456.789:5432/oracle_ledger?sslmode=require

# Heroku Postgres
DATABASE_URL=postgres://username:password@host:5432/database
```

### Query Optimization Settings

#### Index Configuration
```sql
-- Performance indexes for Stripe integration

-- Customer indexes
CREATE INDEX CONCURRENTLY idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX CONCURRENTLY idx_customers_email_active ON customers(email) WHERE active = true;
CREATE INDEX CONCURRENTLY idx_customers_created_at ON customers(created_at);

-- Payment method indexes
CREATE INDEX CONCURRENTLY idx_payment_methods_customer_default ON payment_methods(customer_id, is_default) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX CONCURRENTLY idx_payment_methods_type_status ON payment_methods(type, status);

-- ACH payment indexes
CREATE INDEX CONCURRENTLY idx_ach_payments_customer_status_date ON ach_payments(customer_id, status, scheduled_date);
CREATE INDEX CONCURRENTLY idx_ach_payments_stripe_intent ON ach_payments(stripe_payment_intent_id);
CREATE INDEX CONCURRENTLY idx_ach_payments_return_code ON ach_payments(return_code) WHERE return_code IS NOT NULL;

-- Direct deposit indexes
CREATE INDEX CONCURRENTLY idx_dd_recipients_employee_verification ON direct_deposit_recipients(employee_id, verification_status);
CREATE INDEX CONCURRENTLY idx_dd_payouts_recipient_status ON direct_deposit_payouts(recipient_id, status);
CREATE INDEX CONCURRENTLY idx_dd_payouts_scheduled_date ON direct_deposit_payouts(scheduled_payout_date);

-- Webhook event indexes
CREATE INDEX CONCURRENTLY idx_webhook_events_type_processed ON stripe_webhook_events(event_type, processed_at);
CREATE INDEX CONCURRENTLY idx_webhook_events_customer ON stripe_webhook_events(customer_id) WHERE customer_id IS NOT NULL;

-- PCI audit indexes
CREATE INDEX CONCURRENTLY idx_pci_audit_user_date ON pci_audit_log(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_pci_audit_action_table ON pci_audit_log(action_type, table_name);
```

#### Query Performance Configuration
```javascript
// Database query optimization settings
const queryConfig = {
  // Default query settings
  defaultFetchMode: 'get',     // get, all, one
  defaultLimit: 50,            // Default limit for LIST queries
  defaultOffset: 0,            // Default offset
  
  // Pagination settings
  maxLimit: 100,               // Maximum limit for any query
  defaultPageSize: 50,         // Default page size
  
  // Caching settings
  enableQueryCache: true,
  cacheTTL: 300,               // 5 minutes
  
  // Logging settings
  logQueries: process.env.NODE_ENV === 'development',
  logSlowQueries: true,
  slowQueryThreshold: 1000,    // Log queries slower than 1000ms
};

const migrationsConfig = {
  // Migration settings
  migrationsFolder: './migrations',
  schemaFolder: './schema',
  
  // Transaction settings
  transactionalMigrations: true,
  dropTablesOnRollback: false,
  
  // Backup settings
  backupBeforeMigrations: true,
  backupFolder: './backups'
};
```

### Database Monitoring

```javascript
// Database monitoring configuration
const dbMonitoringConfig = {
  // Connection monitoring
  monitorConnections: true,
  alertOnConnectionLeak: true,
  connectionLeakThreshold: 10, // Number of leaked connections before alert
  
  // Query monitoring
  monitorSlowQueries: true,
  slowQueryThreshold: 1000,    // ms
  logSlowQueries: true,
  
  // Lock monitoring
  monitorLocks: true,
  deadlockDetection: true,
  lockTimeout: 30000,          // ms
  
  // Size monitoring
  monitorDatabaseSize: true,
  alertOnSizeGrowth: true,
  sizeGrowthThreshold: 10,     // GB per day
  
  // Index monitoring
  monitorIndexUsage: true,
  unusedIndexThreshold: 7,     // days
  duplicateIndexDetection: true
};
```

---

## Security Settings

### Authentication Configuration

#### JWT Configuration
```javascript
// JWT configuration
const jwtConfig = {
  // Algorithm and key
  algorithm: 'HS256',
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  issuer: 'oracle-ledger',
  audience: 'oracle-ledger-api',
  
  // Refresh token configuration
  refreshEnabled: true,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Blacklist configuration
  enableBlacklist: true,
  blacklistCache: 'redis',
  blacklistTimeout: 86400, // 24 hours
  
  // Claims configuration
  claims: {
    userId: 'sub',
    email: 'email',
    role: 'role',
    permissions: 'permissions'
  }
};
```

#### Password Policy
```javascript
// Password policy configuration
const passwordPolicy = {
  // Requirements
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  
  // Restrictions
  banCommonPasswords: true,
  banPersonalInfo: true,
  checkPwnedPasswords: true,
  
  // History and expiry
  preventReuse: true,
  reuseLimit: 12,              // Prevent reuse of last 12 passwords
  expiryDays: 90,              // Require password change every 90 days
  warnBeforeExpiry: 7,         // Warn user 7 days before expiry
  
  // Lockout configuration
  maxFailedAttempts: 5,
  lockoutDuration: 900,        // 15 minutes
  progressiveLockout: true,    // Increase lockout time with repeated failures
};
```

### Encryption Configuration

```javascript
// Encryption configuration
const encryptionConfig = {
  // Algorithm
  algorithm: 'aes-256-gcm',
  keyDerivation: 'pbkdf2',
  iterations: 100000,
  keyLength: 32,
  ivLength: 16,
  
  // Salt and pepper
  useSalt: true,
  usePepper: true,
  pepper: process.env.ENCRYPTION_PEPPER,
  
  // Field-level encryption
  encryptFields: [
    'ssn',
    'bankAccountNumber',
    'routingNumber',
    'taxId',
    'creditCardNumber'
  ],
  
  // Encrypted key management
  keyRotationEnabled: true,
  keyRotationInterval: 2592000, // 30 days
  previousKeyRetention: 7       // Keep 7 previous keys
};
```

### API Security Configuration

#### Rate Limiting
```javascript
// Rate limiting configuration
const rateLimitConfig = {
  // Global rate limit
  global: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 1000                  // 1000 requests per 15 minutes
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                    // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true
  },
  
  // Payment endpoints
  payments: {
    windowMs: 60 * 1000,       // 1 minute
    max: 50,                   // 50 payment requests per minute
    skipSuccessfulRequests: false
  },
  
  // ACH endpoints
  ach: {
    windowMs: 60 * 1000,       // 1 minute
    max: 30,                   // 30 ACH requests per minute
    skipSuccessfulRequests: false
  },
  
  // Direct deposit endpoints
  directDeposit: {
    windowMs: 60 * 1000,       // 1 minute
    max: 20,                   // 20 direct deposit requests per minute
    skipSuccessfulRequests: false
  },
  
  // Webhook endpoints
  webhooks: {
    windowMs: 60 * 1000,       // 1 minute
    max: 1000,                 // 1000 webhook requests per minute
    skipSuccessfulRequests: true
  },
  
  // IP-based exclusions
  skipSuccessfulRequests: true,
  skipFailedRequests: true,
  keyGenerator: (req) => req.ip,
  
  // Custom handlers
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP',
  statusCode: 429
};
```

#### CORS Configuration
```javascript
// CORS configuration
const corsConfig = {
  // Allowed origins
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://app.yourdomain.com',
      'https://admin.yourdomain.com'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-User-ID',
    'X-User-Email',
    'X-User-Role',
    'X-Session-ID',
    'X-Access-Purpose'
  ],
  
  // Exposed headers
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  
  // Credentials
  credentials: true,
  
  // Preflight cache
  maxAge: 86400, // 24 hours
  
  // Options success status
  optionsSuccessStatus: 200
};
```

### SSL/TLS Configuration

```javascript
// HTTPS configuration
const httpsConfig = {
  // Certificate paths
  cert: process.env.SSL_CERT_PATH,
  key: process.env.SSL_KEY_PATH,
  ca: process.env.SSL_CA_PATH,
  
  // SSL options
  honorCipherOrder: true,
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  
  // Cipher suites (recommended configuration)
  ciphers: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA',
    'ECDHE-RSA-AES128-SHA',
    'DHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-SHA256',
    'DHE-RSA-AES128-SHA256'
  ].join(':'),
  
  // Security headers
  securityHeaders: {
    hsts: {
      maxAge: 63072000,          // 2 years
      includeSubDomains: true,
      preload: true
    },
    xssProtection: '1; mode=block',
    contentTypeOptions: 'nosniff',
    frameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin'
  },
  
  // HTTP/2
  allowHTTP1: false,
  ALPNProtocols: ['h2', 'http/1.1']
};
```

---

## Monitoring Configuration

### Application Monitoring

#### Health Check Configuration
```javascript
// Health check configuration
const healthCheckConfig = {
  enabled: true,
  
  // Check intervals
  interval: 30000,             // 30 seconds
  timeout: 5000,               // 5 seconds
  
  // Health check endpoints
  endpoints: {
    liveness: '/health/live',
    readiness: '/health/ready',
    health: '/health'
  },
  
  // Health check components
  checks: {
    database: {
      enabled: true,
      type: 'query',
      query: 'SELECT 1',
      timeout: 5000
    },
    
    redis: {
      enabled: process.env.REDIS_ENABLED === 'true',
      type: 'connection',
      timeout: 3000
    },
    
    stripe: {
      enabled: true,
      type: 'api',
      endpoint: 'charges',
      params: { limit: 1 },
      timeout: 10000
    },
    
    diskSpace: {
      enabled: true,
      threshold: 90,           // 90% disk usage
      path: '/'
    },
    
    memory: {
      enabled: true,
      threshold: 85,           // 85% memory usage
      maxAge: 60000
    }
  },
  
  // Custom health indicators
  custom: {
    paymentProcessing: {
      enabled: true,
      checkInterval: 60000,    // 1 minute
      maxFailureRate: 10       // 10% failure rate
    },
    
    achProcessing: {
      enabled: true,
      checkInterval: 300000,   // 5 minutes
      maxFailureRate: 5        // 5% failure rate
    },
    
    webhookProcessing: {
      enabled: true,
      checkInterval: 60000,    // 1 minute
      maxPendingAge: 300000    // 5 minutes
    }
  }
};
```

#### Metrics Configuration
```javascript
// Metrics configuration
const metricsConfig = {
  enabled: true,
  
  // Prometheus configuration
  prometheus: {
    enabled: true,
    port: parseInt(process.env.METRICS_PORT) || 9090,
    path: process.env.METRICS_PATH || '/metrics',
    
    // Default metrics
    collectDefaultMetrics: true,
    
    // Custom metrics
    customMetrics: {
      // Request metrics
      httpRequestDuration: {
        type: 'histogram',
        name: 'http_request_duration_ms',
        help: 'Duration of HTTP requests in milliseconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
      },
      
      // Business metrics
      stripeOperationsTotal: {
        type: 'counter',
        name: 'stripe_operations_total',
        help: 'Total number of Stripe operations',
        labelNames: ['operation_type', 'status', 'environment']
      },
      
      // Payment metrics
      paymentsProcessedTotal: {
        type: 'counter',
        name: 'payments_processed_total',
        help: 'Total number of payments processed',
        labelNames: ['payment_type', 'currency', 'status']
      },
      
      paymentsAmountTotal: {
        type: 'counter',
        name: 'payments_amount_total',
        help: 'Total amount processed in payments',
        labelNames: ['payment_type', 'currency', 'status']
      },
      
      // Database metrics
      databaseConnectionsActive: {
        type: 'gauge',
        name: 'database_connections_active',
        help: 'Number of active database connections'
      },
      
      databaseQueryDuration: {
        type: 'histogram',
        name: 'database_query_duration_ms',
        help: 'Duration of database queries',
        labelNames: ['query_type', 'table'],
        buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
      }
    }
  },
  
  // DataDog configuration
  datadog: {
    enabled: process.env.DATADOG_API_KEY ? true : false,
    apiKey: process.env.DATADOG_API_KEY,
    appKey: process.env.DATADOG_APP_KEY,
    service: 'oracle-ledger-api',
    env: process.env.NODE_ENV || 'development',
    
    // Custom tags
    tags: [
      'service:oracle-ledger-api',
      `env:${process.env.NODE_ENV}`,
      'version:' + process.env.npm_package_version
    ]
  },
  
  // New Relic configuration
  newRelic: {
    enabled: process.env.NEW_RELIC_LICENSE_KEY ? true : false,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    appName: process.env.NEW_RELIC_APP_NAME || 'Oracle Ledger API',
    
    // Distributed tracing
    distributedTracing: {
      enabled: true
    }
  }
};
```

### Log Configuration

#### Structured Logging
```javascript
// Logging configuration
const logConfig = {
  // Log level
  level: process.env.LOG_LEVEL || 'info',
  
  // Log format
  format: process.env.LOG_FORMAT || 'json',
  
  // Log destinations
  transports: [
    // Console logging
    {
      type: 'console',
      enabled: true,
      format: process.env.NODE_ENV === 'development' ? 'simple' : 'json',
      colorize: process.env.NODE_ENV === 'development',
      timestamp: true
    },
    
    // File logging
    {
      type: 'file',
      enabled: process.env.NODE_ENV === 'production',
      filename: process.env.LOG_FILE_PATH || '/var/log/oracle-ledger/application.log',
      level: 'info',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 30,
      format: 'json',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true
    },
    
    // Error file logging
    {
      type: 'file',
      enabled: true,
      filename: process.env.LOG_ERROR_PATH || '/var/log/oracle-ledger/error.log',
      level: 'error',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 30,
      format: 'json',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true
    },
    
    // PCI audit logging
    {
      type: 'file',
      enabled: true,
      filename: '/var/log/oracle-ledger/pci-audit.log',
      level: 'info',
      maxSize: '50m',
      maxFiles: 90,
      format: 'json',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true
    }
  ],
  
  // Log levels per environment
  levels: {
    development: 'debug',
    staging: 'info',
    production: 'warn'
  },
  
  // Sensitive data filtering
  filters: [
    'password',
    'ssn',
    'creditCard',
    'bankAccount',
    'routingNumber',
    'apiKey',
    'secret'
  ],
  
  // Custom fields
  customFields: {
    service: 'oracle-ledger-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
};
```

### Alerting Configuration

```javascript
// Alerting configuration
const alertConfig = {
  // Email alerting
  email: {
    enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
    
    // SMTP configuration
    smtp: {
      host: process.env.ALERT_EMAIL_SMTP_HOST,
      port: parseInt(process.env.ALERT_EMAIL_SMTP_PORT) || 587,
      secure: process.env.ALERT_EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.ALERT_EMAIL_USERNAME,
        pass: process.env.ALERT_EMAIL_PASSWORD
      }
    },
    
    // Recipients
    recipients: {
      critical: process.env.ALERT_EMAIL_RECIPIENTS_CRITICAL?.split(',') || ['admin@yourdomain.com'],
      warning: process.env.ALERT_EMAIL_RECIPIENTS_WARNING?.split(',') || ['ops@yourdomain.com'],
      info: process.env.ALERT_EMAIL_RECIPIENTS_INFO?.split(',') || ['team@yourdomain.com']
    },
    
    // Email templates
    templates: {
      subject: 'ORACLE-LEDGER Alert: {{level}} - {{title}}',
      from: process.env.ALERT_EMAIL_FROM || 'alerts@yourdomain.com'
    }
  },
  
  // Slack alerting
  slack: {
    enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    
    // Channel configuration
    channels: {
      critical: '#alerts-critical',
      warning: '#alerts-warning',
      info: '#alerts-info'
    },
    
    // Alert configuration
    alertOn: {
      highErrorRate: true,
      databaseConnectionFailure: true,
      stripeApiFailure: true,
      diskSpaceLow: true,
      memoryUsageHigh: true,
      paymentFailures: true,
      webhookFailures: true
    }
  },
  
  // PagerDuty alerting
  pagerDuty: {
    enabled: process.env.PAGERDUTY_API_KEY ? true : false,
    apiKey: process.env.PAGERDUTY_API_KEY,
    serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
    
    // Alert triggers
    triggerOn: {
      databaseDown: true,
      stripeApiDown: true,
      highErrorRate: true,
      securityBreach: true
    }
  }
};
```

---

## Backup Configuration

### Database Backup Configuration

#### Automated Backup Schedule
```javascript
// Backup configuration
const backupConfig = {
  // Database backup
  database: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    
    // Schedule
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',  // Daily at 2 AM
    timezone: 'America/New_York',
    
    // Retention
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    
    // Backup types
    types: {
      full: {
        enabled: true,
        frequency: 'daily',
        schedule: '0 2 * * *'
      },
      incremental: {
        enabled: true,
        frequency: 'hourly',
        schedule: '0 * * * *'
      },
      wal: {
        enabled: process.env.NODE_ENV === 'production',
        frequency: 'continuous',
        archiveCommand: 'aws s3 cp %p s3://backup-bucket/wal/%f'
      }
    },
    
    // Storage
    storage: {
      local: {
        enabled: true,
        path: '/backups/oracle-ledger'
      },
      s3: {
        enabled: process.env.BACKUP_S3_ENABLED === 'true',
        bucket: process.env.BACKUP_S3_BUCKET,
        region: process.env.BACKUP_S3_REGION || 'us-east-1',
        accessKey: process.env.BACKUP_S3_ACCESS_KEY,
        secretKey: process.env.BACKUP_S3_SECRET_KEY,
        encryption: 'AES256'
      },
      gcs: {
        enabled: process.env.BACKUP_GCS_ENABLED === 'true',
        bucket: process.env.BACKUP_GCS_BUCKET,
        projectId: process.env.BACKUP_GCS_PROJECT_ID,
        keyFile: process.env.BACKUP_GCS_KEY_FILE
      }
    },
    
    // Compression and encryption
    compression: {
      enabled: true,
      algorithm: 'gzip',
      level: 6
    },
    
    encryption: {
      enabled: process.env.NODE_ENV === 'production',
      algorithm: 'AES-256-CBC',
      keyRotationDays: 30
    }
  },
  
  // File backup
  files: {
    enabled: process.env.FILE_BACKUP_ENABLED === 'true',
    schedule: process.env.FILE_BACKUP_SCHEDULE || '0 1 * * *',
    retentionDays: parseInt(process.env.FILE_BACKUP_RETENTION_DAYS) || 7,
    
    // Directories to backup
    directories: [
      '/var/log/oracle-ledger',
      '/etc/oracle-ledger',
      '/opt/oracle-ledger/config'
    ],
    
    // Exclude patterns
    excludes: [
      '*.tmp',
      '*.log.old',
      'node_modules',
      '.git'
    ]
  }
};
```

#### Backup Verification
```javascript
// Backup verification configuration
const backupVerificationConfig = {
  enabled: true,
  
  // Verification schedule
  schedule: '0 3 * * *',  // Daily at 3 AM
  
  // Verification tests
  tests: {
    integrity: {
      enabled: true,
      checks: ['checksum', 'file_count', 'table_count']
    },
    
    restore: {
      enabled: process.env.NODE_ENV === 'development',
      testDatabase: 'oracle_ledger_backup_test',
      tables: ['customers', 'ach_payments', 'direct_deposit_payouts']
    },
    
    performance: {
      enabled: true,
      maxRestoreTime: 3600000  // 1 hour
    }
  },
  
  // Alerts
  alerts: {
    onFailure: true,
    onSlowRestore: true,
    onSizeMismatch: true
  }
};
```

### Disaster Recovery Configuration

```javascript
// Disaster recovery configuration
const disasterRecoveryConfig = {
  // Recovery objectives
  rto: 3600,    // 1 hour Recovery Time Objective
  rpo: 900,     // 15 minutes Recovery Point Objective
  
  // Backup locations
  primary: {
    type: 'local',
    location: '/backups/oracle-ledger'
  },
  
  secondary: {
    type: 's3',
    location: 's3://oracle-ledger-dr-backups'
  },
  
  // Recovery procedures
  procedures: {
    fullRestore: {
      enabled: true,
      estimatedTime: 1800  // 30 minutes
    },
    
    pointInTimeRestore: {
      enabled: true,
      estimatedTime: 2400  // 40 minutes
    },
    
    partialRestore: {
      enabled: true,
      estimatedTime: 600   // 10 minutes
    }
  },
  
  // Failover configuration
  failover: {
    automatic: false,      // Manual failover for safety
    testFailover: true,
    testFrequency: 'weekly'
  }
};
```

---

## Integration Configuration

### External Service Integration

#### Google Services Integration
```javascript
// Google Services configuration
const googleConfig = {
  // Gemini AI integration
  gemini: {
    enabled: process.env.GOOGLE_AI_API_KEY ? true : false,
    apiKey: process.env.GOOGLE_AI_API_KEY,
    
    // Features
    features: {
      financialAnalysis: true,
      anomalyDetection: true,
      complianceReporting: true,
      naturalLanguageQueries: true
    },
    
    // Rate limits
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 10000
    }
  },
  
  // Google Workspace integration
  workspace: {
    enabled: false,  // Future feature
    serviceAccountKey: process.env.GOOGLE_WORKSPACE_KEY,
    calendarIntegration: false,
    driveIntegration: false
  }
};
```

#### Notification Services Integration
```javascript
// Notification services configuration
const notificationConfig = {
  // Email notifications
  email: {
    enabled: true,
    provider: 'smtp',  // smtp, sendgrid, ses
    
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    },
    
    // SendGrid configuration
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY
    },
    
    // AWS SES configuration
    ses: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    
    // Notification triggers
    triggers: [
      'payment_succeeded',
      'payment_failed',
      'ach_return',
      'direct_deposit_processed',
      'webhook_failed',
      'security_alert'
    ]
  },
  
  // SMS notifications
  sms: {
    enabled: process.env.TWILIO_ACCOUNT_SID ? true : false,
    provider: 'twilio',
    
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER
    },
    
    // Critical alerts only
    triggers: [
      'security_breach',
      'database_down',
      'payment_system_failure'
    ]
  },
  
  // Push notifications
  push: {
    enabled: false,  // Future feature
    provider: 'firebase',
    
    firebase: {
      serverKey: process.env.FIREBASE_SERVER_KEY
    }
  }
};
```

### Third-Party Integrations

#### Accounting Software Integration
```javascript
// Accounting software integration
const accountingIntegrationConfig = {
  // QuickBooks integration
  quickbooks: {
    enabled: process.env.QUICKBOOKS_CLIENT_ID ? true : false,
    
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
    
    // Sync settings
    sync: {
      customers: true,
      payments: true,
      vendors: true,
      invoices: true,
      purchaseOrders: true
    },
    
    // Sync frequency
    frequency: 'hourly',
    
    // Error handling
    retryFailedSyncs: true,
    maxRetries: 3
  },
  
  // Xero integration
  xero: {
    enabled: process.env.XERO_CLIENT_ID ? true : false,
    
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUri: process.env.XERO_REDIRECT_URI,
    
    // Sync settings
    sync: {
      bankTransactions: true,
      invoices: true,
      contacts: true,
      accounts: true
    },
    
    frequency: 'hourly'
  },
  
  // NetSuite integration
  netsuite: {
    enabled: false,  // Future feature
    accountId: process.env.NETSUITE_ACCOUNT_ID,
    consumerKey: process.env.NETSUITE_CONSUMER_KEY,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
    tokenId: process.env.NETSUITE_TOKEN_ID,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
    
    sync: {
      transactions: true,
      customers: true,
      vendors: true,
      inventory: false
    }
  }
};
```

#### Banking Integration
```javascript
// Banking integration
const bankingIntegrationConfig = {
  // Plaid integration
  plaid: {
    enabled: process.env.PLAID_CLIENT_ID ? true : false,
    
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    environment: process.env.PLAID_ENV || 'production',
    
    // Features
    features: {
      accountVerification: true,
      transactionSync: true,
      balanceInquiry: true,
      identityVerification: false  // Requires additional compliance
    },
    
    // Data retention
    dataRetentionDays: 2555,  // 7 years for financial records
    encryptionRequired: true
  },
  
  // Yodlee integration
  yodlee: {
    enabled: false,  // Future feature
    appId: process.env.YODLEE_APP_ID,
    apiKey: process.env.YODLEE_API_KEY,
    
    features: {
      accountAggregation: true,
      transactionImport: true,
      bankStatementAnalysis: true
    }
  }
};
```

---

## Performance Tuning

### Application Performance

#### Caching Configuration
```javascript
// Caching configuration
const cacheConfig = {
  // Redis cache
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
      
      // Connection pool
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000
    },
    
    // TTL settings
    ttl: {
      customer: parseInt(process.env.CACHE_TTL_CUSTOMERS) || 300,      // 5 minutes
      payment: parseInt(process.env.CACHE_TTL_PAYMENTS) || 60,         // 1 minute
      statistics: parseInt(process.env.CACHE_TTL_STATISTICS) || 1800,  // 30 minutes
      webhook: parseInt(process.env.CACHE_TTL_WEBHOOKS) || 3600,       // 1 hour
      default: 300  // 5 minutes
    },
    
    // Cache patterns
    patterns: {
      customer: 'customer:*',
      customerPayments: 'customer:*:payments',
      paymentStatus: 'payment:*:status',
      statistics: 'stats:*',
      webhook: 'webhook:*'
    }
  },
  
  // Application-level cache
  application: {
    enabled: true,
    
    // LRU cache configuration
    lru: {
      maxSize: 1000,          // Maximum number of entries
      ttl: 300000,            // 5 minutes default TTL
      updateAgeOnGet: true
    },
    
    // Cache warming
    warming: {
      enabled: true,
      schedules: {
        statistics: '0 */6 * * *',    // Every 6 hours
        customers: '0 */1 * * *'      // Every hour
      }
    }
  },
  
  // CDN cache
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    
    provider: process.env.CDN_PROVIDER || 'cloudflare',
    
    settings: {
      staticAssets: {
        cacheControl: 'public, max-age=31536000',  // 1 year
        compression: 'gzip'
      },
      
      apiResponses: {
        cacheControl: 'private, max-age=60',       // 1 minute
        varyBy: ['authorization', 'accept-encoding']
      }
    }
  }
};
```

#### Database Connection Pooling
```javascript
// Database connection pooling
const dbPoolingConfig = {
  // Pool settings
  min: parseInt(process.env.DB_POOL_MIN) || 5,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  
  // Idle connection management
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false,
  
  // Connection validation
  validation: {
    enabled: true,
    testQuery: 'SELECT 1',
    validationTimeout: 5000
  },
  
  // Pool monitoring
  monitoring: {
    enabled: true,
    logPoolEvents: process.env.NODE_ENV === 'development',
    maxPoolWaitTime: 30000,
    maxPoolCreationTime: 60000
  },
  
  // Connection lifecycle
  lifecycle: {
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  }
};
```

#### Query Optimization
```javascript
// Query optimization configuration
const queryOptimizationConfig = {
  // Query caching
  caching: {
    enabled: true,
    
    // Cache key generation
    keyGenerator: (query, params) => {
      return `query:${Buffer.from(query + JSON.stringify(params)).toString('base64')}`;
    },
    
    // TTL by query type
    ttlByType: {
      select: 300,      // 5 minutes
      insert: 0,        // No cache
      update: 0,        // No cache
      delete: 0         // No cache
    }
  },
  
  // Pagination optimization
  pagination: {
    defaultLimit: 50,
    maxLimit: 1000,
    
    // Seek pagination for large datasets
    seekPagination: {
      enabled: true,
      threshold: 10000,  // Switch to seek pagination after 10k records
      orderColumn: 'created_at',
      orderDirection: 'desc'
    }
  },
  
  // Batch operations
  batching: {
    enabled: true,
    
    // Batch size limits
    limits: {
      inserts: 1000,
      updates: 500,
      deletes: 500
    },
    
    // Auto-flush configuration
    flushInterval: 5000,     // 5 seconds
    flushSize: 100           // 100 operations
  },
  
  // Prepared statements
  preparedStatements: {
    enabled: true,
    
    // Cache prepared statements
    cache: {
      enabled: true,
      maxSize: 1000,
      ttl: 3600000  // 1 hour
    }
  }
};
```

### Load Balancing Configuration

```javascript
// Load balancing configuration
const loadBalancingConfig = {
  // Application load balancing
  application: {
    enabled: process.env.NODE_ENV === 'production',
    
    algorithm: 'least_conn',  // round_robin, least_conn, ip_hash
    
    servers: [
      '127.0.0.1:3001',
      '127.0.0.1:3002',
      '127.0.0.1:3003'
    ],
    
    // Health checks
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retries: 3,
      path: '/health'
    },
    
    // Session persistence
    persistence: {
      enabled: true,
      type: 'cookie',  // cookie, ip_hash
      cookie: {
        name: 'lb_session',
        ttl: 3600000   // 1 hour
      }
    }
  },
  
  // Database load balancing
  database: {
    enabled: false,  // Requires PostgreSQL cluster setup
    
    readReplicas: [
      {
        host: 'db-replica-1.example.com',
        port: 5432,
        weight: 1
      },
      {
        host: 'db-replica-2.example.com',
        port: 5432,
        weight: 1
      }
    ],
    
    writeMaster: {
      host: 'db-master.example.com',
      port: 5432
    },
    
    // Routing rules
    routing: {
      readQueries: ['SELECT', 'SHOW', 'DESCRIBE'],
      writeQueries: ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP']
    }
  }
};
```

---

## Compliance Configuration

### PCI DSS Compliance

```javascript
// PCI DSS compliance configuration
const pciComplianceConfig = {
  // Data encryption
  encryption: {
    algorithm: 'AES-256-GCM',
    keyRotation: {
      enabled: true,
      interval: 2592000  // 30 days
    },
    
    // Field-level encryption for PAN
    panEncryption: {
      enabled: true,
      method: 'tokenization',  // tokenization or encryption
      tokenFormat: 'decimal'   // decimal or alphanumeric
    }
  },
  
  // Access control
  accessControl: {
    authentication: {
      multiFactorRequired: true,
      sessionTimeout: 900,      // 15 minutes
      passwordPolicy: 'strict'
    },
    
    authorization: {
      roleBasedAccess: true,
      principleOfLeastPrivilege: true,
      accessReview: {
        frequency: 'quarterly',
        automated: true
      }
    }
  },
  
  // Network security
  networkSecurity: {
    segmentation: true,
    firewallRequired: true,
    intrusionDetection: true,
    vulnerabilityScanning: {
      frequency: 'monthly',
      automated: true
    }
  },
  
  // Audit logging
  auditLogging: {
    enabled: true,
    logLevel: 'debug',
    
    // Log retention
    retention: {
      duration: 2555,  // 7 years in days
      immediateBackup: true
    },
    
    // Log monitoring
    monitoring: {
      realTimeAlerting: true,
      suspiciousActivityDetection: true,
      failedAccessTracking: true
    }
  },
  
  // Vulnerability management
  vulnerabilityManagement: {
    regularScanning: true,
    patchManagement: {
      criticalPatches: 72,     // 72 hours
      highPriorityPatches: 7,  // 7 days
      mediumPriorityPatches: 30 // 30 days
    },
    
    securityUpdates: {
      automated: true,
      testingRequired: true,
      rollbackCapability: true
    }
  },
  
  // Incident response
  incidentResponse: {
    plan: {
      defined: true,
      documented: true,
      tested: true
    },
    
    procedures: {
      notificationTimeframe: 72,  // 72 hours
      containmentTimeframe: 24,   // 24 hours
      eradicationTimeframe: 72    // 72 hours
    }
  }
};
```

### NACHA Compliance Configuration

```javascript
// NACHA compliance configuration
const nachaComplianceConfig = {
  // ACH processing rules
  achProcessing: {
    // Return timeframes
    returnTimeframes: {
      r01_insufficientFunds: 2,   // 2 banking days
      r02_accountClosed: 2,
      r03_noAccount: 2,
      r04_invalidAccount: 2,
      r05_invalidRouting: 2,
      r06_returnPerODFI: 2,
      r07_authRevoked: 60,        // 60 calendar days
      r08_stopPayment: 60,
      r09_uncollectedFunds: 60,
      r10_customerAdvises: 60
    },
    
    // Company identification
    companyIdentification: {
      required: true,
      format: 'numeric',
      length: 10,
      validation: 'strict'
    },
    
    // SEC codes
    secCodes: {
      ppd: {
        enabled: true,
        description: 'Prearranged Payments and Deposits',
        useCase: 'payroll, benefits, bills'
      },
      ccd: {
        enabled: true,
        description: 'Cash Concentration and Disbursement',
        useCase: 'corporate treasury'
      },
      web: {
        enabled: true,
        description: 'Web-initiated Entries',
        useCase: 'internet payments'
      },
      cbpp: {
        enabled: false,
        description: 'Customer Bradley Byron Privacy Protection Act',
        useCase: 'international ACH'
      }
    }
  },
  
  // Data integrity
  dataIntegrity: {
    // Field validation
    validation: {
      routingNumber: {
        enabled: true,
        checksum: true
      },
      accountNumber: {
        enabled: true,
        length: { min: 4, max: 17 },
        alphanumeric: true
      },
      amount: {
        enabled: true,
        max: 999999999999,  // $9,999,999,999.99
        decimal: 2
      }
    },
    
    // Duplicate detection
    duplicateDetection: {
      enabled: true,
      lookbackPeriod: 5,   // days
      matchingFields: ['amount', 'routing', 'account', 'name']
    }
  },
  
  // Reporting requirements
  reporting: {
    // Annual reporting
    annualReporting: {
      required: true,
      deadline: 'March 31',
      volumeThreshold: 100  // transactions
    },
    
    // Monthly volume reporting
    monthlyReporting: {
      required: true,
      deadline: '15 days after month end',
      format: 'Nacha 94A'
    },
    
    // Return reporting
    returnReporting: {
      required: true,
      deadline: '5 banking days',
      format: 'Nacha 94B'
    }
  }
};
```

### SOX Compliance Configuration

```javascript
// SOX compliance configuration
const soxComplianceConfig = {
  // Internal controls
  internalControls: {
    // Segregation of duties
    segregationOfDuties: {
      enabled: true,
      
      // Role separation
      roles: {
        initiator: {
          canCreate: true,
          canApprove: false,
          canExecute: false
        },
        approver: {
          canCreate: false,
          canApprove: true,
          canExecute: false
        },
        executor: {
          canCreate: false,
          canApprove: false,
          canExecute: true
        }
      }
    },
    
    // Authorization controls
    authorizationControls: {
      // Monetary limits
      monetaryLimits: {
        singleTransaction: 10000,     // $10,000
        daily: 50000,                 // $50,000
        monthly: 500000,              // $500,000
        annual: 5000000               // $5,000,000
      },
      
      // Multi-level approval
      multiLevelApproval: {
        enabled: true,
        thresholds: {
          level1: 1000,   // $1,000
          level2: 10000,  // $10,000
          level3: 100000  // $100,000
        }
      }
    }
  },
  
  // Audit trail
  auditTrail: {
    enabled: true,
    
    // Logged events
    events: [
      'user_login',
      'user_logout',
      'transaction_created',
      'transaction_approved',
      'transaction_executed',
      'transaction_modified',
      'transaction_deleted',
      'user_access',
      'data_export',
      'configuration_change'
    ],
    
    // Retention
    retention: {
      duration: 2555,  // 7 years
      immediateStorage: true,
      tamperProof: true
    },
    
    // Monitoring
    monitoring: {
      realTimeAlerting: true,
      suspiciousActivityDetection: true,
      unauthorizedAccessDetection: true
    }
  },
  
  // Documentation requirements
  documentation: {
    // Process documentation
    processDocumentation: {
      required: true,
      reviewFrequency: 'annual',
      versionControl: true
    },
    
    // Control documentation
    controlDocumentation: {
      required: true,
      testingFrequency: 'quarterly',
      evidenceRetention: 2555  // 7 years
    }
  }
};
```

---

*This Configuration Guide provides comprehensive documentation for configuring ORACLE-LEDGER Stripe Integration. For additional information, see DEPLOYMENT_GUIDE.md, API_INTEGRATION_GUIDE.md, TROUBLESHOOTING_GUIDE.md, and DEVELOPER_GUIDE.md.*
