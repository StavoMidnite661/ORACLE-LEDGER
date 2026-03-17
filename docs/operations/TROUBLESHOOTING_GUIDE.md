# ORACLE-LEDGER Stripe Integration - Troubleshooting Guide

## 📋 Table of Contents

1. [Quick Start Troubleshooting](#quick-start-troubleshooting)
2. [Common Issues and Solutions](#common-issues-and-solutions)
3. [Error Message Reference](#error-message-reference)
4. [Performance Issues](#performance-issues)
5. [Database Issues](#database-issues)
6. [Stripe Integration Issues](#stripe-integration-issues)
7. [Payment Processing Issues](#payment-processing-issues)
8. [ACH Payment Issues](#ach-payment-issues)
9. [Direct Deposit Issues](#direct-deposit-issues)
10. [Webhook Issues](#webhook-issues)
11. [Authentication and Authorization Issues](#authentication-and-authorization-issues)
12. [Security Issues](#security-issues)
13. [Debugging Tools and Techniques](#debugging-tools-and-techniques)
14. [Log Analysis](#log-analysis)
15. [Monitoring and Alerting](#monitoring-and-alerting)
16. [Support and Escalation](#support-and-escalation)

---

## Quick Start Troubleshooting

### System Health Check

Before diving into specific issues, run a comprehensive health check:

```bash
# 1. Check application status
curl -f http://localhost:3001/api/health

# 2. Verify database connection
psql $DATABASE_URL -c "SELECT 1;"

# 3. Test Stripe connectivity
curl -X POST http://localhost:3001/api/stripe/test

# 4. Check disk space
df -h

# 5. Check memory usage
free -h

# 6. Review recent errors
tail -n 50 /var/log/oracle-ledger/error.log
```

### Common Quick Fixes

| Issue | Quick Solution |
|-------|----------------|
| "Cannot connect to database" | Restart PostgreSQL: `sudo systemctl restart postgresql` |
| "Port already in use" | Kill process: `lsof -ti:3001 \| xargs kill` |
| "Stripe API key invalid" | Check `.env` file for correct keys |
| "Module not found" | Run: `npm install` |
| "Permission denied" | Check file permissions: `chmod -R 755 /opt/oracle-ledger` |

### Diagnostic Commands

```bash
# System information
uname -a
cat /etc/os-release

# Node.js version
node --version
npm --version

# Database version
psql --version

# Application process status
pm2 status
pm2 monit

# Network connections
netstat -tlnp | grep :3001

# Recent system logs
journalctl -u oracle-ledger-api --since "1 hour ago"
```

---

## Common Issues and Solutions

### Installation Issues

#### Issue: Node.js Version Incompatibility

**Symptoms:**
```
Error: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check current version
node --version

# Install Node.js 20.x using NodeSource (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# For macOS
brew install node@20

# For Windows, download from https://nodejs.org/
```

#### Issue: PostgreSQL Connection Failed

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if PostgreSQL is listening on the correct port
sudo netstat -tlnp | grep 5432

# Verify connection string format
DATABASE_URL=postgresql://username:password@host:port/database

# Test connection
psql postgresql://username:password@host:port/database
```

#### Issue: Permission Denied Errors

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solution:**
```bash
# Fix application directory permissions
sudo chown -R oracle-ledger:oracle-ledger /opt/oracle-ledger
chmod -R 755 /opt/oracle-ledger

# Fix log directory permissions
sudo mkdir -p /var/log/oracle-ledger
sudo chown oracle-ledger:oracle-ledger /var/log/oracle-ledger
chmod 755 /var/log/oracle-ledger

# Fix database socket permissions (if applicable)
sudo chmod 777 /var/run/postgresql
```

### Runtime Issues

#### Issue: Application Won't Start

**Symptoms:**
```
Application starts but immediately exits
Error in logs: "Address already in use"
```

**Solution:**
```bash
# Check if port is already in use
lsof -i :3001
netstat -tlnp | grep :3001

# Kill existing process
kill -9 $(lsof -ti:3001)

# Or use PM2 to manage processes
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.js

# Check for configuration errors
npm run db:push
npm run dev:backend
```

#### Issue: High Memory Usage

**Symptoms:**
```
Application becomes slow or crashes
Out of memory errors
```

**Solution:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Optimize Node.js memory
# Add to ecosystem.config.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Check for memory leaks
# Add memory profiling
node --inspect server/api.ts

# Monitor garbage collection
node --expose-gc --max-old-space-size=1024 server/api.ts
```

---

## Error Message Reference

### API Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `INVALID_REQUEST` | 400 | Invalid request parameters | Check request format and required fields |
| `AUTHENTICATION_REQUIRED` | 401 | Authentication token missing or invalid | Provide valid JWT token |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions | Check user role and permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist | Verify resource ID or identifier |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists | Use different identifier or update existing |
| `VALIDATION_ERROR` | 422 | Request validation failed | Fix validation errors in request body |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Implement rate limiting or retry later |
| `STRIPE_ERROR` | 502 | Stripe API error | Check Stripe dashboard and API key |
| `DATABASE_ERROR` | 503 | Database connection or query error | Check database connectivity |
| `EXTERNAL_SERVICE_ERROR` | 503 | External service unavailable | Check external service status |
| `INTERNAL_ERROR` | 500 | Internal server error | Check logs and contact support |

### Stripe Error Codes

#### Payment Errors

| Stripe Error Code | Description | Common Causes | Solution |
|-------------------|-------------|---------------|----------|
| `card_declined` | Card was declined | Insufficient funds, card restrictions | Contact card issuer |
| `expired_card` | Card has expired | Card expiration date passed | Request new card |
| `incorrect_cvc` | CVC code is incorrect | Wrong CVC code | Verify CVC with customer |
| `incorrect_number` | Card number is incorrect | Typo in card number | Verify card number |
| `invalid_expiry_month` | Invalid expiration month | Month out of range (1-12) | Fix expiration month |
| `invalid_expiry_year` | Invalid expiration year | Year in past or too far future | Fix expiration year |
| `invalid_number` | Invalid card number | Luhn check failed | Verify card number |
| `invalid_cvc` | Invalid CVC format | Wrong number of digits | Check CVC format |
| `processing_error` | Temporary processing error | Stripe temporary issue | Retry request |
| `rate_limit` | Too many requests | Rate limit exceeded | Implement backoff strategy |

#### ACH Payment Errors

| ACH Return Code | Description | Common Causes | Solution |
|----------------|-------------|---------------|----------|
| `R01` | Insufficient funds | Account has insufficient funds | Contact customer, retry later |
| `R02` | Account closed | Bank account has been closed | Request new bank account |
| `R03` | No account/Unable to locate | Account doesn't exist or not found | Verify account information |
| `R04` | Invalid account number | Account number is incorrect | Request correct account number |
| `R05` | Invalid routing number | Routing number is incorrect | Verify routing number |
| `R06` | Returned per ODFI request | Bank requested return | Contact bank for details |
| `R07` | Authorization revoked | Customer revoked authorization | Re-collect authorization |
| `R08` | Stop payment | Customer placed stop payment | Contact customer |
| `R09` | Uncollected funds | Insufficient funds available | Retry when funds available |
| `R10` | Customer advises not authorized | Unauthorized transaction | Investigate and resolve |

#### Customer Errors

| Error Type | Description | Solution |
|------------|-------------|----------|
| `customer_not_found` | Customer doesn't exist | Create customer first or use correct ID |
| `email_exists` | Email already exists | Use different email or update existing customer |
| `invalid_email_format` | Email format is invalid | Provide valid email address |
| `phone_exists` | Phone number already exists | Use different phone number |
| `address_invalid` | Address validation failed | Provide complete and valid address |

### Database Error Codes

#### PostgreSQL Errors

| Error Code | Description | Common Causes | Solution |
|------------|-------------|---------------|----------|
| `23505` | Unique violation | Duplicate key value | Use unique values |
| `23503` | Foreign key violation | Referenced record doesn't exist | Create referenced record first |
| `23502` | Not null violation | Required field is null | Provide required field value |
| `23514` | Check constraint violation | Data doesn't meet constraint | Fix data to meet constraints |
| `08006` | Connection failure | Database connection lost | Check database server and network |
| `08003` | Connection does not exist | Connection not established | Establish connection first |
| `42P01` | Undefined table | Table doesn't exist | Run database migrations |
| `42703` | Undefined column | Column doesn't exist | Check schema and migrations |

#### Connection Issues

| Error | Description | Solution |
|-------|-------------|----------|
| `connection refused` | No PostgreSQL server running | Start PostgreSQL service |
| `timeout` | Connection timeout | Check network and server load |
| `authentication failed` | Invalid credentials | Verify username and password |
| `database does not exist` | Database not created | Create database first |
| `permission denied` | User lacks database access | Grant necessary permissions |

---

## Performance Issues

### Slow API Response Times

#### Issue: API Endpoints Timeout

**Symptoms:**
- Requests taking > 30 seconds
- Gateway timeout errors (504)
- Frontend timeouts

**Diagnosis:**
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/api/customers"

# Create curl-format.txt:
echo 'time_namelookup:  %{time_namelookup}\ntime_connect:  %{time_connect}\ntime_appconnect:  %{time_appconnect}\ntime_pretransfer:  %{time_pretransfer}\ntime_redirect:  %{time_redirect}\ntime_starttransfer:  %{time_starttransfer}\ntime_total:  %{time_total}\n' > curl-format.txt

# Monitor database queries
# Enable query logging in PostgreSQL
# Edit postgresql.conf:
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000  # Log queries > 1 second
```

**Solutions:**

1. **Database Optimization**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_customers_email ON customers(email);
CREATE INDEX CONCURRENTLY idx_ach_payments_customer_status ON ach_payments(customer_id, status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM customers WHERE email = 'test@example.com';

-- Update table statistics
ANALYZE customers;
```

2. **Connection Pooling**
```javascript
// Increase connection pool size
const db = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'oracle_ledger',
  user: 'oracle_ledger',
  password: 'password',
  max: 20,              // Increase from default 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

3. **Query Optimization**
```javascript
// Use LIMIT for large datasets
const customers = await db
  .select()
  .from(customers)
  .limit(50)
  .offset(0);

// Use selective queries
const activeCustomers = await db
  .select()
  .from(customers)
  .where(eq(customers.active, true));

// Avoid N+1 queries
const customersWithPayments = await db
  .select({
    customer: customers,
    paymentCount: sql<number>`count(${payments.id})`
  })
  .from(customers)
  .leftJoin(payments, eq(customers.id, payments.customerId))
  .groupBy(customers.id);
```

#### Issue: High CPU Usage

**Symptoms:**
- Server CPU > 80%
- Slow request processing
- System becomes unresponsive

**Diagnosis:**
```bash
# Check CPU usage by process
top -p $(pgrep -f "node.*api.ts")

# Check for infinite loops or recursive calls
strace -p <process-id>

# Monitor garbage collection
node --expose-gc server/api.ts
# Then monitor GC activity in logs
```

**Solutions:**

1. **Code Optimization**
```javascript
// Avoid synchronous operations
// BAD:
function processPayments() {
  for (let payment of payments) {
    const result = stripe.charges.retrieve(payment.stripeChargeId); // Blocking!
    // ...
  }
}

// GOOD:
async function processPayments() {
  const promises = payments.map(payment => 
    stripe.charges.retrieve(payment.stripeChargeId)
  );
  const results = await Promise.all(promises);
  // ...
}
```

2. **Memory Management**
```javascript
// Implement proper cleanup
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Avoid memory leaks
class PaymentProcessor {
  constructor() {
    this.processingQueue = [];
    this.maxQueueSize = 1000; // Prevent unbounded growth
  }
  
  async addToQueue(payment) {
    if (this.processingQueue.length >= this.maxQueueSize) {
      throw new Error('Queue is full');
    }
    this.processingQueue.push(payment);
  }
}
```

### Database Performance Issues

#### Issue: Slow Database Queries

**Symptoms:**
- Queries taking > 5 seconds
- Database connection timeouts
- High database CPU usage

**Diagnosis:**
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check database connections
SELECT count(*) as active_connections, state 
FROM pg_stat_activity 
GROUP BY state;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**Solutions:**

1. **Index Optimization**
```sql
-- Create composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_ach_payments_customer_status_date 
ON ach_payments(customer_id, status, scheduled_date);

-- Create partial indexes for active records
CREATE INDEX CONCURRENTLY idx_payment_methods_active_default 
ON payment_methods(customer_id, is_default) 
WHERE status = 'active' AND deleted_at IS NULL;

-- Remove unused indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_unused_index;
```

2. **Query Optimization**
```sql
-- Use covering indexes
CREATE INDEX CONCURRENTLY idx_customers_covering 
ON customers(customer_id, active, created_at, email) 
WHERE active = true;

-- Use appropriate data types
-- BAD: Using TEXT for fixed-length fields
-- GOOD: Use VARCHAR(255) for names, dates for date fields
```

3. **Connection Pool Configuration**
```javascript
// Optimize connection pool settings
const dbConfig = {
  // Production settings
  min: 10,                    // Minimum connections
  max: 50,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000,
  
  // Enable connection validation
  testOnBorrow: true,
  validationQuery: 'SELECT 1',
  
  // Connection lifecycle
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};
```

---

## Stripe Integration Issues

### API Key Issues

#### Issue: Invalid Stripe API Key

**Symptoms:**
```
Error: Invalid API Key provided
StripeAuthenticationError: Invalid API Key provided
```

**Diagnosis:**
```bash
# Test API key directly
curl https://api.stripe.com/v1/charges \
  -u sk_test_51...:

# Check key format
# Test keys: sk_test_...
# Live keys: sk_live_...
```

**Solution:**
1. **Verify API Key Format**
```javascript
// Check environment variables
console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY?.substring(0, 15) + '...');

// Validate key format
if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
  throw new Error('Invalid Stripe secret key format');
}
```

2. **Check Environment**
```javascript
// Ensure correct environment keys
const isTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const expectedPrefix = isTest ? 'sk_test_' : 'sk_live_';

if (!process.env.STRIPE_SECRET_KEY?.startsWith(expectedPrefix)) {
  console.warn(`Using ${isTest ? 'live' : 'test'} key in ${process.env.NODE_ENV} environment`);
}
```

#### Issue: Webhook Signature Verification Failed

**Symptoms:**
```
Webhook Error: No signatures found matching the expected signature
```

**Solution:**
1. **Verify Webhook Secret**
```javascript
// Check webhook secret environment variable
console.log('Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15) + '...');

// Verify webhook endpoint in Stripe Dashboard
// https://dashboard.stripe.com/test/webhooks
```

2. **Fix Webhook Handler**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  res.json({received: true});
});
```

### Payment Processing Issues

#### Issue: Payment Intent Fails

**Symptoms:**
```
Error: Your card was declined
Error: Insufficient funds
```

**Diagnosis:**
```javascript
// Debug payment intent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd',
  payment_method_types: ['card'],
  confirm: true,
  payment_method: 'pm_1234567890',
});

// Check error details
if (paymentIntent.status === 'requires_payment_method') {
  console.log('Payment failed:', paymentIntent.last_payment_error);
}
```

**Solution:**
1. **Handle Different Error Types**
```javascript
async function createPayment(customerId, amount, paymentMethodId) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return { success: true, paymentIntent };
  } catch (error) {
    console.error('Payment failed:', error);
    
    // Handle specific error types
    if (error.type === 'StripeCardError') {
      return { 
        success: false, 
        error: {
          type: 'card_error',
          code: error.code,
          message: error.message
        }
      };
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return {
        success: false,
        error: {
          type: 'invalid_request',
          message: error.message
        }
      };
    }
    
    return { 
      success: false, 
      error: {
        type: 'api_error',
        message: 'An unexpected error occurred'
      }
    };
  }
}
```

2. **Retry Logic for Transient Errors**
```javascript
async function retryPayment(paymentFunc, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await paymentFunc();
    } catch (error) {
      // Don't retry client errors
      if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
        throw error;
      }
      
      // Retry on rate limits and temporary errors
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
      console.log(`Retrying payment in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await retryPayment(async () => {
  return await stripe.paymentIntents.create(paymentData);
});
```

---

## ACH Payment Issues

### ACH Return Codes

#### Issue: High ACH Return Rate

**Symptoms:**
- Return rate > 5%
- Multiple R01, R02, R03 errors
- Customer complaints about declined payments

**Diagnosis:**
```sql
-- Analyze return patterns
SELECT 
  return_code,
  COUNT(*) as return_count,
  AVG(adjusted_amount_cents) as avg_amount
FROM ach_returns 
GROUP BY return_code
ORDER BY return_count DESC;

-- Check return rate by customer
SELECT 
  c.email,
  COUNT(ar.id) as returns_count,
  COUNT(ap.id) as total_payments,
  ROUND(COUNT(ar.id) * 100.0 / COUNT(ap.id), 2) as return_rate
FROM customers c
LEFT JOIN ach_payments ap ON c.id = ap.customer_id
LEFT JOIN ach_returns ar ON ap.id = ar.ach_payment_id
GROUP BY c.id, c.email
HAVING COUNT(ar.id) * 100.0 / COUNT(ap.id) > 5
ORDER BY return_rate DESC;
```

**Solutions:**

1. **Improve Data Validation**
```javascript
// Enhanced ACH validation
function validateACHData(customerData) {
  const errors = [];
  
  // Validate routing number
  if (!isValidRoutingNumber(customerData.routingNumber)) {
    errors.push('Invalid routing number');
  }
  
  // Validate account number
  if (!isValidAccountNumber(customerData.accountNumber)) {
    errors.push('Invalid account number');
  }
  
  // Validate customer name
  if (!customerData.firstName || !customerData.lastName) {
    errors.push('First and last name are required');
  }
  
  return errors;
}

function isValidRoutingNumber(routingNumber) {
  // Remove non-numeric characters
  const cleanRouting = routingNumber.replace(/\D/g, '');
  
  // Check length
  if (cleanRouting.length !== 9) {
    return false;
  }
  
  // Validate checksum
  const digits = cleanRouting.split('').map(Number);
  const checksum = (3 * (digits[0] + digits[3] + digits[6]) +
                   7 * (digits[1] + digits[4] + digits[7]) +
                   (digits[2] + digits[5] + digits[8])) % 10;
  
  return checksum === 0;
}
```

2. **Microdeposit Verification**
```javascript
// Implement microdeposit verification for new accounts
async function setupACHWithVerification(customerId, bankAccountData) {
  try {
    // Create payment method with microdeposits
    const bankAccount = await stripe.customers.createSource(customerId, {
      source: {
        object: 'bank_account',
        account_holder_type: 'individual',
        account_number: bankAccountData.accountNumber,
        routing_number: bankAccountData.routingNumber,
        country: 'US',
        currency: 'usd',
      },
    });
    
    // Set up microdeposit verification
    await stripe.customers.verifySource(customerId, bankAccount.id, {
      amounts: [32, 45], // Random microdeposit amounts
    });
    
    return { success: true, bankAccount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### Issue: ACH Settlement Delays

**Symptoms:**
- Payments taking > 3 business days to settle
- Customer inquiries about delayed payments
- Cash flow issues

**Diagnosis:**
```sql
-- Check settlement times
SELECT 
  ap.id,
  ap.amount_cents,
  ap.scheduled_date,
  ap.actual_settlement_date,
  ap.actual_settlement_date - ap.scheduled_date as settlement_delay
FROM ach_payments ap
WHERE ap.status = 'succeeded'
  AND ap.actual_settlement_date IS NOT NULL
ORDER BY settlement_delay DESC
LIMIT 20;
```

**Solutions:**

1. **Check ACH Class Code Settings**
```javascript
// Use appropriate ACH class codes
const achClassCodes = {
  // PPD: Prearranged Payments and Deposits (payroll, bills)
  ppd: {
    description: 'Prearranged Payments and Deposits',
    settlementTime: '3 business days',
    useCase: 'recurring payments'
  },
  
  // CCD: Cash Concentration and Disbursement (corporate)
  ccd: {
    description: 'Cash Concentration and Disbursement',
    settlementTime: '1 business day',
    useCase: 'business payments'
  },
  
  // WEB: Web-initiated entries (online payments)
  web: {
    description: 'Web-Initiated Entries',
    settlementTime: '3 business days',
    useCase: 'online payments'
  }
};

// Always use CCD for faster settlement when appropriate
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount,
  currency: 'usd',
  payment_method_types: ['us_bank_account'],
  payment_method_data: {
    type: 'us_bank_account',
    us_bank_account: {
      routing_number: '110000000',
      account_number: '000123456789',
      account_type: 'checking',
    },
  },
  // Use CCD for faster settlement
  payment_method_options: {
    us_bank_account: {
      verification_method: 'instant',
    },
  },
});
```

---

## Direct Deposit Issues

### Account Verification Issues

#### Issue: Recipient Account Verification Failed

**Symptoms:**
```
Account verification failed
KYC requirements not met
```

**Diagnosis:**
```sql
-- Check verification status
SELECT 
  id,
  email,
  verification_status,
  kyc_status,
  charges_enabled,
  payouts_enabled,
  created_at
FROM direct_deposit_recipients
WHERE verification_status = 'failed'
  OR kyc_status = 'failed'
ORDER BY created_at DESC;
```

**Solutions:**

1. **Improve Verification Process**
```javascript
// Enhanced verification flow
async function setupDirectDepositRecipient(recipientData) {
  try {
    // Create connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: recipientData.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: recipientData.firstName,
        last_name: recipientData.lastName,
        email: recipientData.email,
        phone: recipientData.phone,
        dob: {
          day: new Date(recipientData.dateOfBirth).getDate(),
          month: new Date(recipientData.dateOfBirth).getMonth() + 1,
          year: new Date(recipientData.dateOfBirth).getFullYear(),
        },
        address: {
          line1: recipientData.address.line1,
          city: recipientData.address.city,
          state: recipientData.address.state,
          postal_code: recipientData.address.postalCode,
          country: 'US',
        },
      },
    });
    
    // Create account link for verification
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/direct-deposit/refresh`,
      return_url: `${process.env.FRONTEND_URL}/direct-deposit/success`,
      type: 'account_onboarding',
    });
    
    return {
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error('Direct deposit setup failed:', error);
    return { success: false, error: error.message };
  }
}
```

2. **Handle Verification Requirements**
```javascript
// Check verification requirements
async function checkVerificationRequirements(accountId) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    const requirements = {
      pendingVerification: account.requirements?.currently_due || [],
      disabledReason: account.requirements?.disabled_reason,
      pastDue: account.requirements?.past_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
    };
    
    return requirements;
  } catch (error) {
    console.error('Failed to check verification requirements:', error);
    return null;
  }
}
```

### Payout Issues

#### Issue: Direct Deposit Payouts Failing

**Symptoms:**
```
Payout failed: Insufficient funds
Payout failed: Account restricted
```

**Diagnosis:**
```sql
-- Analyze payout failures
SELECT 
  ddp.stripe_payout_id,
  ddp.recipient_id,
  ddp.amount_cents,
  ddp.failure_reason,
  ddp.created_at
FROM direct_deposit_payouts ddp
WHERE ddp.status = 'failed'
ORDER BY ddp.created_at DESC
LIMIT 20;
```

**Solutions:**

1. **Verify Payout Eligibility**
```javascript
// Check recipient eligibility before payout
async function verifyPayoutEligibility(recipientId, amount) {
  try {
    const account = await stripe.accounts.retrieve(recipientId);
    
    const checks = {
      isEnabled: account.charges_enabled && account.payouts_enabled,
      verificationStatus: account.requirements?.currently_due?.length === 0,
      hasBankAccount: account.external_accounts?.data?.length > 0,
      availableBalance: account.balance?.available?.[0]?.amount || 0,
    };
    
    if (!checks.isEnabled) {
      throw new Error('Account is not enabled for payouts');
    }
    
    if (!checks.verificationStatus) {
      throw new Error('Account verification requirements not met');
    }
    
    if (!checks.hasBankAccount) {
      throw new Error('No bank account on file');
    }
    
    if (checks.availableBalance < amount) {
      throw new Error('Insufficient available balance');
    }
    
    return { eligible: true, checks };
  } catch (error) {
    return { eligible: false, error: error.message };
  }
}
```

2. **Handle Payout Failures**
```javascript
// Retry failed payouts with proper error handling
async function retryPayout(payoutId, delayHours = 24) {
  try {
    // Check if enough time has passed for retry
    const payout = await stripe.payouts.retrieve(payoutId);
    
    const timeSinceFailure = Date.now() - new Date(payout.arrival_date * 1000).getTime();
    const minRetryDelay = delayHours * 60 * 60 * 1000;
    
    if (timeSinceFailure < minRetryDelay) {
      throw new Error('Not enough time has passed since last failure');
    }
    
    // Cancel old payout if possible
    if (payout.status === 'pending') {
      await stripe.payouts.cancel(payoutId);
    }
    
    // Create new payout
    const newPayout = await stripe.payouts.create({
      amount: payout.amount,
      currency: payout.currency,
      method: payout.method,
      statement_descriptor: payout.statement_descriptor,
    }, {
      stripeAccount: payout.account,
    });
    
    return { success: true, payout: newPayout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Webhook Issues

### Webhook Processing Failures

#### Issue: Webhooks Not Being Received

**Symptoms:**
- No webhook events in database
- Webhook events show as "unprocessed"
- Real-time updates not working

**Diagnosis:**
```sql
-- Check webhook event log
SELECT 
  stripe_event_id,
  event_type,
  processing_status,
  retry_count,
  created_at,
  error_message
FROM stripe_webhook_events
WHERE processing_status = 'failed'
ORDER BY created_at DESC
LIMIT 20;

-- Check for missing events
SELECT 
  event_type,
  COUNT(*) as event_count,
  MAX(created_at) as last_received
FROM stripe_webhook_events
GROUP BY event_type
ORDER BY last_received DESC;
```

**Solutions:**

1. **Verify Webhook Endpoint**
```bash
# Test webhook endpoint directly
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "Stripe-Signature: t=1234567890,v1=test_signature" \
  -d '{"type": "test.event", "data": {}}'

# Check webhook endpoint in Stripe Dashboard
# https://dashboard.stripe.com/test/webhooks
```

2. **Implement Robust Webhook Handler**
```javascript
// Webhook handler with retry logic
const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    // Log webhook event
    await logWebhookEvent(event);
    
    // Process event based on type
    switch (event.type) {
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Mark event as processed
    await markEventAsProcessed(event.id);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    // Mark event as failed
    await markEventAsFailed(event.id, error.message);
    
    // Retry failed events
    scheduleRetry(event);
    
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
```

3. **Implement Event Idempotency**
```javascript
// Prevent duplicate event processing
async function isEventProcessed(eventId) {
  const result = await db
    .select()
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.stripeEventId, eventId))
    .limit(1);
  
  return result.length > 0;
}

async function processWebhookEvent(event) {
  // Check if event was already processed
  const alreadyProcessed = await isEventProcessed(event.id);
  if (alreadyProcessed) {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }
  
  // Process event
  // ...
  
  // Mark as processed
  await markEventAsProcessed(event.id);
}
```

#### Issue: Webhook Retries and Timeouts

**Symptoms:**
```
Webhook delivery attempts: 5
Webhook timeout
Rate limit exceeded
```

**Solutions:**

1. **Optimize Webhook Processing Time**
```javascript
// Use background processing for time-consuming tasks
const Bull = require('bull');
const webhookQueue = new Bull('webhook processing', {
  redis: process.env.REDIS_URL,
});

webhookQueue.process(async (job) => {
  const { event } = job.data;
  
  // Process event in background
  await processWebhookEvent(event);
  
  return { processed: true };
});

// In webhook handler
webhookQueue.add({ event });
res.json({ received: true }); // Respond immediately
```

2. **Implement Proper Error Handling**
```javascript
// Retry configuration for different error types
const retryConfig = {
  // Don't retry client errors
  clientErrors: [400, 401, 403, 404, 422],
  
  // Retry server errors and timeouts
  serverErrors: [500, 502, 503, 504],
  
  // Max retries
  maxRetries: 5,
  
  // Backoff strategy
  backoff: {
    type: 'exponential',
    delay: 1000,    // Start with 1 second
    maxDelay: 30000 // Max 30 seconds
  }
};
```

---

## Authentication and Authorization Issues

### JWT Token Issues

#### Issue: Invalid or Expired JWT Tokens

**Symptoms:**
```
401 Unauthorized
Token has expired
Invalid token signature
```

**Diagnosis:**
```javascript
// Add token debugging
app.use((req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    console.log('Token received:', token.substring(0, 20) + '...');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token valid:', { userId: decoded.sub, exp: decoded.exp });
      req.user = decoded;
    } catch (error) {
      console.log('Token error:', error.message);
    }
  }
  next();
});
```

**Solutions:**

1. **Fix Token Generation**
```javascript
// Proper JWT token generation
function generateToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    issuer: 'oracle-ledger',
    audience: 'oracle-ledger-api'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
    issuer: 'oracle-ledger',
    audience: 'oracle-ledger-api'
  });
}

// Refresh token generation
function generateRefreshToken(user) {
  return jwt.sign({
    sub: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  }, process.env.JWT_REFRESH_SECRET);
}
```

2. **Handle Token Refresh**
```javascript
// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Get user from database
    const user = await getUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 86400
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### Permission Issues

#### Issue: Insufficient Permissions

**Symptoms:**
```
403 Forbidden
User lacks required permission
Access denied
```

**Diagnosis:**
```javascript
// Add permission debugging
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    const user = req.user;
    
    console.log('Checking permission:', {
      userId: user?.sub,
      userRole: user?.role,
      requiredPermission,
      userPermissions: user?.permissions
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check role-based permissions
    const rolePermissions = getRolePermissions(user.role);
    const hasPermission = user.permissions?.includes(requiredPermission) || 
                         rolePermissions.includes(requiredPermission);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredPermission,
        userRole: user.role
      });
    }
    
    next();
  };
}
```

**Solutions:**

1. **Implement Proper RBAC**
```javascript
// Role-based access control
const rolePermissions = {
  admin: [
    'customers.read',
    'customers.write',
    'payments.read',
    'payments.write',
    'ach.read',
    'ach.write',
    'direct_deposit.read',
    'direct_deposit.write',
    'webhooks.read',
    'webhooks.write',
    'users.read',
    'users.write',
    'audit.read',
    'compliance.read',
    'settings.write'
  ],
  
  finance_manager: [
    'customers.read',
    'payments.read',
    'payments.write',
    'ach.read',
    'ach.write',
    'direct_deposit.read',
    'direct_deposit.write',
    'reconciliation.read',
    'reconciliation.write',
    'reports.read'
  ],
  
  compliance_officer: [
    'customers.read',
    'payments.read',
    'ach.read',
    'direct_deposit.read',
    'audit.read',
    'audit.write',
    'compliance.read',
    'compliance.write',
    'reports.read'
  ],
  
  accountant: [
    'customers.read',
    'payments.read',
    'reconciliation.read',
    'reconciliation.write',
    'reports.read'
  ],
  
  auditor: [
    'customers.read',
    'payments.read',
    'ach.read',
    'direct_deposit.read',
    'audit.read',
    'compliance.read',
    'reports.read'
  ]
};
```

---

## Security Issues

### API Security Issues

#### Issue: Rate Limiting Bypass

**Symptoms:**
```
High API usage from single IP
Potential DDoS attack
Rate limit headers showing 0 remaining
```

**Diagnosis:**
```javascript
// Enhanced rate limiting with multiple strategies
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Multiple rate limiting strategies
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip,
});

const paymentLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 payment requests per minute
  keyGenerator: (req) => req.ip + ':' + (req.user?.sub || 'anonymous'),
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api/ach-payments', paymentLimiter);
```

#### Issue: SQL Injection Vulnerability

**Symptoms:**
```
Unexpected database errors
Unusual query patterns in logs
Potential data exposure
```

**Prevention:**
```javascript
// Use parameterized queries only
// BAD - SQL injection vulnerability
app.get('/api/customers/:id', async (req, res) => {
  const query = `SELECT * FROM customers WHERE id = ${req.params.id}`;
  const result = await db.query(query); // Vulnerable!
});

// GOOD - Parameterized query
app.get('/api/customers/:id', async (req, res) => {
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, req.params.id));
  
  if (result.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  res.json(result[0]);
});

// Use Drizzle ORM for automatic parameterization
const customer = await db
  .select()
  .from(customers)
  .where(and(
    eq(customers.email, email),
    eq(customers.active, true)
  ));
```

### Input Validation Issues

#### Issue: Insufficient Input Validation

**Symptoms:**
```
Invalid data in database
API accepts malformed requests
Potential security vulnerabilities
```

**Solutions:**

1. **Implement Comprehensive Validation**
```javascript
const Joi = require('joi');

// Customer creation validation schema
const customerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  
  billingAddress: Joi.object({
    line1: Joi.string().min(1).max(200).required(),
    line2: Joi.string().max(200).optional().allow(''),
    city: Joi.string().min(1).max(100).required(),
    state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).required(),
    postalCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
    country: Joi.string().length(2).pattern(/^[A-Z]{2}$/).required()
  }).required(),
  
  metadata: Joi.object().optional()
});

// Payment validation schema
const paymentSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  amount: Joi.number().integer().min(50).max(999999999999).required(), // $0.50 to $9,999,999.99
  currency: Joi.string().valid('usd', 'eur', 'gbp', 'cad').required(),
  description: Joi.string().max(500).optional(),
  paymentMethodId: Joi.string().required(),
  metadata: Joi.object().optional()
});

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(422).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedData = value;
    next();
  };
}

// Usage
app.post('/api/customers', validate(customerSchema), createCustomer);
app.post('/api/payments', validate(paymentSchema), createPayment);
```

---

## Debugging Tools and Techniques

### Application Debugging

#### Enable Debug Mode
```bash
# Start application with debug logging
DEBUG=oracle-ledger:* npm run dev:backend

# Debug specific modules
DEBUG=oracle-ledger:stripe,oracle-ledger:database npm run dev:backend

# Enable Node.js inspector
node --inspect server/api.ts

# Enable garbage collection debugging
node --expose-gc --inspect server/api.ts
```

#### Request Tracing
```javascript
// Add request tracing middleware
const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
  const traceId = uuidv4();
  req.traceId = traceId;
  
  // Add trace ID to response headers
  res.set('X-Trace-ID', traceId);
  
  // Log request with trace ID
  console.log(`[${traceId}] ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.sub
  });
  
  // Log response time
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${traceId}] Response: ${res.statusCode} (${duration}ms)`);
    
    // Alert on slow responses
    if (duration > 5000) {
      console.warn(`[${traceId}] Slow response detected: ${duration}ms`);
    }
  });
  
  next();
});
```

### Database Debugging

#### Enable Query Logging
```sql
-- Enable query logging (temporarily)
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
SELECT pg_reload_conf();

-- Check recent queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY total_time DESC
LIMIT 20;
```

#### Database Connection Monitoring
```javascript
// Database connection monitoring
class DatabaseMonitor {
  constructor(db) {
    this.db = db;
    this.connectionCount = 0;
    this.queryCount = 0;
    this.slowQueries = [];
    
    setInterval(() => {
      this.logStats();
    }, 30000); // Log every 30 seconds
  }
  
  async logStats() {
    try {
      // Get connection count
      const connectionResult = await this.db.query(`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      // Get slow queries
      const slowQueryResult = await this.db.query(`
        SELECT query, mean_time, calls
        FROM pg_stat_statements 
        WHERE mean_time > 1000 
        ORDER BY mean_time DESC 
        LIMIT 5
      `);
      
      console.log('Database Stats:', {
        connections: connectionResult.rows[0].connections,
        queryCount: this.queryCount,
        slowQueries: slowQueryResult.rows
      });
    } catch (error) {
      console.error('Database monitoring error:', error);
    }
  }
  
  wrapQuery(queryFunction) {
    return async (...args) => {
      const startTime = Date.now();
      this.queryCount++;
      
      try {
        const result = await queryFunction(...args);
        const duration = Date.now() - startTime;
        
        if (duration > 5000) {
          console.warn('Slow query detected:', { duration, args: args[0] });
        }
        
        return result;
      } catch (error) {
        console.error('Query error:', { error, args: args[0] });
        throw error;
      }
    };
  }
}

const monitor = new DatabaseMonitor(db);

// Wrap database queries with monitoring
const originalQuery = db.query.bind(db);
db.query = monitor.wrapQuery(originalQuery);
```

### Stripe Integration Debugging

#### Debug Stripe API Calls
```javascript
// Stripe debugging utility
const stripeDebug = {
  enabled: process.env.NODE_ENV === 'development',
  
  logRequest: (operation, params) => {
    if (stripeDebug.enabled) {
      console.log(`[STRIPE] ${operation}:`, {
        params: JSON.stringify(params, null, 2),
        timestamp: new Date().toISOString()
      });
    }
  },
  
  logResponse: (operation, response) => {
    if (stripeDebug.enabled) {
      console.log(`[STRIPE] ${operation} response:`, {
        id: response.id,
        status: response.status,
        amount: response.amount,
        currency: response.currency,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  logError: (operation, error) => {
    console.error(`[STRIPE] ${operation} error:`, {
      type: error.type,
      code: error.code,
      message: error.message,
      param: error.param,
      timestamp: new Date().toISOString()
    });
  }
};

// Wrap Stripe operations with debugging
const originalCreate = stripe.paymentIntents.create.bind(stripe.paymentIntents);

stripe.paymentIntents.create = async (params) => {
  stripeDebug.logRequest('createPaymentIntent', params);
  
  try {
    const result = await originalCreate(params);
    stripeDebug.logResponse('createPaymentIntent', result);
    return result;
  } catch (error) {
    stripeDebug.logError('createPaymentIntent', error);
    throw error;
  }
};
```

---

## Log Analysis

### Log File Locations

| Log Type | Location | Description |
|----------|----------|-------------|
| Application | `/var/log/oracle-ledger/application.log` | Main application logs |
| Error | `/var/log/oracle-ledger/error.log` | Error logs only |
| PCI Audit | `/var/log/oracle-ledger/pci-audit.log` | PCI compliance logs |
| Access | `/var/log/oracle-ledger/access.log` | HTTP access logs |
| Webhook | `/var/log/oracle-ledger/webhook.log` | Webhook processing logs |
| Database | PostgreSQL logs | Database query logs |

### Log Analysis Commands

#### Search for Errors
```bash
# Search for specific error patterns
grep -r "ERROR" /var/log/oracle-ledger/ | grep -v "DEBUG"

# Search for payment failures
grep -r "payment.*fail" /var/log/oracle-ledger/ | tail -20

# Search for authentication issues
grep -r "auth.*fail\|401\|403" /var/log/oracle-ledger/ | tail -20

# Search for database errors
grep -r "database.*error\|connection.*fail" /var/log/oracle-ledger/ | tail -20

# Search for Stripe errors
grep -r "stripe.*error\|StripeCardError" /var/log/oracle-ledger/ | tail -20
```

#### Analyze Log Patterns
```bash
# Count errors by type
grep -r "ERROR" /var/log/oracle-ledger/error.log | \
  awk '{print $4}' | sort | uniq -c | sort -nr

# Analyze response times
grep "response time" /var/log/oracle-ledger/application.log | \
  awk '{print $NF}' | sort -n | tail -20

# Check for slow queries
grep "slow query" /var/log/oracle-ledger/database.log | \
  awk '{print $5}' | sort -n | tail -20

# Analyze webhook processing times
grep "webhook.*processed" /var/log/oracle-ledger/webhook.log | \
  awk '{print $NF}' | sort -n | tail -20
```

### Real-time Log Monitoring

#### Monitor Logs in Real-time
```bash
# Monitor all application logs
tail -f /var/log/oracle-ledger/*.log

# Monitor specific log types
tail -f /var/log/oracle-ledger/error.log

# Monitor with grep filter
tail -f /var/log/oracle-ledger/application.log | grep -E "(ERROR|CRITICAL|WARN)"

# Monitor Stripe-specific logs
tail -f /var/log/oracle-ledger/application.log | grep "STRIPE"
```

#### Log Aggregation with Journald
```bash
# Configure journald for application logs
sudo mkdir -p /etc/journald.conf.d
sudo cat > /etc/journald.conf.d/oracle-ledger.conf << EOF
[Journal]
Storage=persistent
Compress=yes
SystemMaxUse=1G
SystemKeepFree=500M
MaxRetentionSec=30day
EOF

# Restart journald
sudo systemctl restart systemd-journald

# View application logs through journald
sudo journalctl -u oracle-ledger-api -f

# Search journald logs
sudo journalctl --since "1 hour ago" -u oracle-ledger-api
sudo journalctl --grep "ERROR" -u oracle-ledger-api
sudo journalctl --since "2025-11-02T10:00:00" -u oracle-ledger-api
```

### Log Rotation Configuration

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
    sharedscripts
    postrotate
        # Reload application if using PM2
        pm2 reloadLogs
        # Or restart logging if using systemd
        systemctl reload oracle-ledger-api
    endscript
}
```

---

## Monitoring and Alerting

### Health Check Monitoring

#### Custom Health Check Script
```bash
#!/bin/bash
# health-check.sh

HEALTH_ENDPOINT="http://localhost:3001/api/health"
EMAIL_ALERT="admin@yourdomain.com"
LOG_FILE="/var/log/oracle-ledger/health-check.log"

# Function to send alert
send_alert() {
    local message="$1"
    echo "$(date): ALERT - $message" | tee -a "$LOG_FILE"
    
    # Send email alert
    echo "$message" | mail -s "ORACLE-LEDGER Alert" "$EMAIL_ALERT"
    
    # Send Slack alert (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"ORACLE-LEDGER Alert: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Check application health
response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT")

if [ "$response" != "200" ]; then
    send_alert "Application health check failed (HTTP $response)"
    exit 1
fi

# Check database connectivity
db_check=$(psql "$DATABASE_URL" -t -c "SELECT 1;" 2>/dev/null)

if [ "$db_check" != "1" ]; then
    send_alert "Database connectivity check failed"
    exit 1
fi

# Check disk space
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 90 ]; then
    send_alert "Disk usage critical: ${disk_usage}%"
    exit 1
fi

# Check memory usage
mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$mem_usage" -gt 90 ]; then
    send_alert "Memory usage critical: ${mem_usage}%"
    exit 1
fi

# Check recent errors in log
error_count=$(grep -c "ERROR" /var/log/oracle-ledger/error.log | tail -1)
if [ "$error_count" -gt 10 ]; then
    send_alert "High error rate detected: $error_count errors in recent logs"
    exit 1
fi

echo "$(date): Health check passed" >> "$LOG_FILE"
```

#### Cron Job Setup
```bash
# Add to crontab
# Check every 5 minutes
*/5 * * * * /path/to/health-check.sh

# Check every minute for critical services
* * * * * /path/to/critical-service-check.sh

# Daily backup verification
0 3 * * * /path/to/backup-verification.sh
```

### Prometheus Monitoring

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'oracle-ledger-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
      
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
```

#### Alert Rules
```yaml
# alert_rules.yml
groups:
  - name: oracle-ledger
    rules:
      - alert: ApplicationDown
        expr: up{job="oracle-ledger-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "ORACLE-LEDGER application is down"
          description: "Application has been down for more than 1 minute"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} requests per second"
          
      - alert: DatabaseConnectionFailure
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "Cannot connect to PostgreSQL database"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
          
      - alert: PaymentFailureRate
        expr: rate(stripe_operations_total{status="failed"}[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High payment failure rate"
          description: "Payment failure rate is {{ $value }} operations per second"
          
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low"
          description: "Disk space is {{ $value | humanizePercentage }} full"
```

### Grafana Dashboards

#### Dashboard Configuration
```json
{
  "dashboard": {
    "title": "ORACLE-LEDGER Monitoring",
    "panels": [
      {
        "title": "Application Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"oracle-ledger-api\"}",
            "legendFormat": "Application Status"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, http_request_duration_seconds_bucket)",
            "legendFormat": "50th percentile"
          },
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          },
          {
            "expr": "rate(http_requests_total{status=~\"4..\"}[5m])",
            "legendFormat": "4xx Errors"
          }
        ]
      },
      {
        "title": "Payment Processing",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(stripe_operations_total{status=\"succeeded\"}[5m])",
            "legendFormat": "Successful Payments"
          },
          {
            "expr": "rate(stripe_operations_total{status=\"failed\"}[5m])",
            "legendFormat": "Failed Payments"
          }
        ]
      }
    ]
  }
}
```

---

## Support and Escalation

### Issue Classification

#### Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **Critical** | System down or major functionality broken | 1 hour | Database corruption, payment system failure, security breach |
| **High** | Significant functionality impaired | 4 hours | ACH processing down, webhook failures, API timeouts |
| **Medium** | Minor functionality issues | 1 business day | Slow response times, non-critical feature bugs |
| **Low** | Cosmetic issues or enhancement requests | 5 business days | UI inconsistencies, documentation updates |

#### Issue Template
```markdown
## Issue Report

**Severity:** [Critical/High/Medium/Low]
**Priority:** [P1/P2/P3/P4]
**Environment:** [Development/Staging/Production]
**Component:** [API/Database/Stripe/Webhook/Frontend]

### Description
Clear description of the issue

### Steps to Reproduce
1. Step one
2. Step two
3. Step three

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Logs
```
Relevant log entries
```

### Additional Information
- Browser/OS: [if applicable]
- User affected: [if applicable]
- Frequency: [always/sometimes/once]
- Impact: [number of users affected]
```

### Escalation Procedures

#### Internal Escalation
1. **Level 1 - Application Support**
   - Initial triage and basic troubleshooting
   - Log analysis and pattern identification
   - Response: 1-4 hours

2. **Level 2 - Technical Team**
   - Complex technical issues
   - Code-level debugging
   - Database optimization
   - Response: 4-24 hours

3. **Level 3 - Architecture Team**
   - System design issues
   - Performance problems
   - Security vulnerabilities
   - Response: 1-3 days

4. **Level 4 - Management**
   - Critical business impact
   - External vendor issues
   - Resource allocation
   - Response: Immediate

#### External Escalation
1. **Stripe Support**
   - Contact: https://support.stripe.com/
   - For: Stripe API issues, account problems, compliance questions
   - Response: 1-24 hours depending on plan

2. **Database Support**
   - For: PostgreSQL issues, performance problems
   - Response: Depends on support plan

3. **Cloud Provider Support**
   - For: Infrastructure issues, network problems
   - Response: Depends on support tier

### Contact Information

#### Internal Contacts
- **On-Call Engineer**: Available 24/7 via PagerDuty
- **DevOps Team**: devops@yourdomain.com
- **Database Admin**: dba@yourdomain.com
- **Security Team**: security@yourdomain.com
- **Product Manager**: product@yourdomain.com

#### External Contacts
- **Stripe Support**: https://support.stripe.com/
- **Database Vendor**: [Your DB vendor support]
- **Hosting Provider**: [Your hosting provider support]
- **Monitoring Provider**: [Your monitoring provider support]

### Documentation Links
- **API Documentation**: https://docs.yourdomain.com/api
- **System Architecture**: https://docs.yourdomain.com/architecture
- **Runbooks**: https://docs.yourdomain.com/runbooks
- **Incident Response**: https://docs.yourdomain.com/incident-response

---

## Emergency Procedures

### System Down Recovery
1. **Immediate Assessment** (0-15 minutes)
   - Verify the issue scope
   - Check system status dashboard
   - Notify on-call engineer
   - Begin incident log

2. **Initial Response** (15-30 minutes)
   - Implement emergency fixes if available
   - Switch to backup systems if needed
   - Notify stakeholders
   - Begin root cause analysis

3. **Recovery** (30 minutes - 2 hours)
   - Apply permanent fixes
   - Verify system functionality
   - Update monitoring and alerts
   - Conduct post-incident review

### Data Breach Response
1. **Immediate Actions** (0-30 minutes)
   - Isolate affected systems
   - Preserve evidence
   - Notify security team
   - Begin breach assessment

2. **Short-term Response** (30 minutes - 4 hours)
   - Implement containment measures
   - Notify affected customers (if required)
   - Work with legal team
   - Engage external forensics if needed

3. **Long-term Response** (4+ hours)
   - Complete forensic investigation
   - Implement security improvements
   - Update policies and procedures
   - Conduct security training

---

*This Troubleshooting Guide provides comprehensive documentation for diagnosing and resolving issues in ORACLE-LEDGER Stripe Integration. For additional information, see DEPLOYMENT_GUIDE.md, API_INTEGRATION_GUIDE.md, CONFIGURATION_GUIDE.md, and DEVELOPER_GUIDE.md.*
