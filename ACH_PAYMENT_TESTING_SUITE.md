# ORACLE-LEDGER ACH Payment Testing Suite

## Overview

This comprehensive test suite provides end-to-end testing for Stripe ACH payment flows in the ORACLE-LEDGER application. The suite includes automated testing for payment processing, API integration, frontend functionality, and database operations.

## Test Suite Components

### 1. Test Environment Setup (`test-environment-setup.js`)

**Purpose**: Initializes and configures the complete test environment

**Features**:
- Database setup with test data
- Stripe test mode configuration
- Environment variables and configuration
- Test user accounts and permissions
- Mock data generation

**Usage**:
```javascript
const { setupTestEnvironment } = require('./test-environment-setup');

async function initializeTests() {
  await setupTestEnvironment();
  console.log('Test environment ready');
}
```

### 2. ACH Payment Flow Tests (`test-ach-flows.js`)

**Purpose**: Comprehensive testing of ACH payment processing workflows

**Test Coverage**:
- Customer creation and Stripe customer setup
- Bank account verification (instant and micro-deposits)
- ACH payment intent creation and processing
- Payment confirmation and settlement tracking
- ACH return processing and corrections
- Reconciliation and journal entry creation
- Webhook processing and event handling

**Usage**:
```javascript
const { runAchFlowTests } = require('./test-ach-flows');

async function testAchPayments() {
  const { results, report } = await runAchFlowTests();
  
  console.log(`Tests passed: ${results.passed}/${results.total}`);
  console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  
  return report;
}
```

### 3. API Integration Tests (`test-stripe-apis.js`)

**Purpose**: Testing all Stripe API endpoints and integration

**Test Coverage**:
- Customer API endpoints
- Payment method management
- Payment intent processing
- Charges API
- Balance and reconciliation
- Webhook management
- Error handling and validation
- Rate limiting and authentication
- API versioning and idempotency

**Usage**:
```javascript
const { runStripeApiTests } = require('./test-stripe-apis');

async function testApiIntegration() {
  const { results, report } = await runStripeApiTests();
  
  console.log('Performance Summary:');
  console.log(`Average execution time: ${report.performance.averageExecutionTime}ms`);
  console.log(`Slowest test: ${report.performance.slowestTests[0]?.name}`);
  
  return report;
}
```

### 4. Frontend Integration Tests (`test-frontend-integration.js`)

**Purpose**: End-to-end testing of React frontend components and user workflows

**Test Coverage**:
- React component rendering
- Form validation and error handling
- ACH payment workflow UI
- Customer management interface
- Bank account management
- Payment history views
- Settings and configuration
- Responsive design
- Accessibility compliance
- State management and routing

**Usage**:
```javascript
const { runFrontendIntegrationTests } = require('./test-frontend-integration');

async function testFrontend() {
  const { results, report } = await runFrontendIntegrationTests();
  
  console.log('Frontend Coverage:');
  console.log(`Components tested: ${report.coverage.componentsTested}`);
  console.log(`Critical paths: ${report.coverage.criticalPathsTested}`);
  
  return report;
}
```

### 5. Database Integration Tests (`test-database-integration.js`)

**Purpose**: Comprehensive testing of database operations and data integrity

**Test Coverage**:
- Database schema validation
- Table operations (CRUD)
- Data integrity constraints
- Transaction integrity
- Indexes and performance
- Triggers and automation
- Data persistence and retrieval
- Backup and recovery procedures

**Usage**:
```javascript
const { runDatabaseIntegrationTests } = require('./test-database-integration');

async function testDatabase() {
  const { results, report } = await runDatabaseIntegrationTests();
  
  console.log('Database Metrics:');
  console.log(`Total tables: ${report.databaseMetrics.totalTables}`);
  console.log(`Coverage: ${report.databaseMetrics.coverage}`);
  
  return report;
}
```

## Running the Complete Test Suite

### Individual Test Suites

Run specific test suites:

```bash
# Test environment setup
node -e "require('./test-environment-setup').setupTestEnvironment().then(() => console.log('Setup complete'))"

# ACH payment flows
node -e "require('./test-ach-flows').runAchFlowTests().then(r => console.log(JSON.stringify(r.report, null, 2)))"

# API integration
node -e "require('./test-stripe-apis').runStripeApiTests().then(r => console.log(JSON.stringify(r.report, null, 2)))"

# Frontend integration
node -e "require('./test-frontend-integration').runFrontendIntegrationTests().then(r => console.log(JSON.stringify(r.report, null, 2)))"

# Database integration
node -e "require('./test-database-integration').runDatabaseIntegrationTests().then(r => console.log(JSON.stringify(r.report, null, 2)))"
```

### Complete Test Suite Runner

Create a master test runner:

```javascript
// run-all-tests.js
const { setupTestEnvironment, cleanupTestEnvironment } = require('./test-environment-setup');
const { runAchFlowTests } = require('./test-ach-flows');
const { runStripeApiTests } = require('./test-stripe-apis');
const { runFrontendIntegrationTests } = require('./test-frontend-integration');
const { runDatabaseIntegrationTests } = require('./test-database-integration');

async function runCompleteTestSuite() {
  console.log('🚀 Starting ORACLE-LEDGER ACH Payment Test Suite...\n');
  
  const startTime = Date.now();
  const results = {
    environment: null,
    achFlows: null,
    apiIntegration: null,
    frontendIntegration: null,
    databaseIntegration: null,
    summary: null
  };

  try {
    // Initialize environment
    console.log('📦 Setting up test environment...');
    await setupTestEnvironment();
    results.environment = { success: true, timestamp: new Date().toISOString() };

    // Run test suites
    console.log('\n💳 Testing ACH Payment Flows...');
    results.achFlows = await runAchFlowTests();
    
    console.log('\n🔌 Testing API Integration...');
    results.apiIntegration = await runStripeApiTests();
    
    console.log('\n🖥️  Testing Frontend Integration...');
    results.frontendIntegration = await runFrontendIntegrationTests();
    
    console.log('\n🗄️  Testing Database Integration...');
    results.databaseIntegration = await runDatabaseIntegrationTests();

    // Generate summary
    const totalTests = results.achFlows.results.total + 
                      results.apiIntegration.results.total + 
                      results.frontendIntegration.results.total + 
                      results.databaseIntegration.results.total;
    
    const totalPassed = results.achFlows.results.passed + 
                       results.apiIntegration.results.passed + 
                       results.frontendIntegration.results.passed + 
                       results.databaseIntegration.results.passed;
    
    const totalFailed = results.achFlows.results.failed + 
                       results.apiIntegration.results.failed + 
                       results.frontendIntegration.results.failed + 
                       results.databaseIntegration.results.failed;

    results.summary = {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: ((totalPassed / totalTests) * 100).toFixed(2) + '%',
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    // Print results
    console.log('\n📊 TEST SUITE RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${results.summary.successRate}`);
    console.log(`Execution Time: ${results.summary.executionTime}ms`);
    
    console.log('\n📈 DETAILED RESULTS');
    console.log('-'.repeat(50));
    
    // Environment
    console.log('Environment Setup: ✅ PASSED');
    
    // ACH Flows
    const ach = results.achFlows.results;
    console.log(`ACH Payment Flows: ${ach.passed}/${ach.total} (${((ach.passed/ach.total)*100).toFixed(1)}%)`);
    
    // API Integration
    const api = results.apiIntegration.results;
    console.log(`API Integration: ${api.passed}/${api.total} (${((api.passed/api.total)*100).toFixed(1)}%)`);
    
    // Frontend Integration
    const frontend = results.frontendIntegration.results;
    console.log(`Frontend Integration: ${frontend.passed}/${frontend.total} (${((frontend.passed/frontend.total)*100).toFixed(1)}%)`);
    
    // Database Integration
    const db = results.databaseIntegration.results;
    console.log(`Database Integration: ${db.passed}/${db.total} (${((db.passed/db.total)*100).toFixed(1)}%)`);

    if (totalFailed > 0) {
      console.log('\n❌ FAILED TESTS');
      console.log('-'.repeat(50));
      
      [...results.achFlows.results.tests, ...results.apiIntegration.results.tests, 
       ...results.frontendIntegration.results.tests, ...results.databaseIntegration.results.tests]
        .filter(test => !test.success)
        .forEach(test => {
          console.log(`- ${test.name}: ${test.error}`);
        });
    }

    console.log('\n✅ Test suite completed successfully!');
    return results;

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    results.error = error.message;
    throw error;
    
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test environment...');
    await cleanupTestEnvironment();
    console.log('✅ Cleanup completed');
  }
}

// Run if called directly
if (require.main === module) {
  runCompleteTestSuite()
    .then(results => {
      const fs = require('fs');
      fs.writeFileSync('./test-results/complete-test-report.json', JSON.stringify(results, null, 2));
      console.log('\n📄 Complete test report saved to test-results/complete-test-report.json');
      process.exit(results.summary.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteTestSuite };
```

## Environment Configuration

### Required Environment Variables

Create a `.env.test` file:

```env
# Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=oracle_ledger_test
TEST_DB_USER=test_user
TEST_DB_PASSWORD=test_password

# Stripe Configuration
STRIPE_TEST_SECRET_KEY=sk_test_your_test_key_here
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration
TEST_APP_URL=http://localhost:3000
TEST_API_URL=http://localhost:3001/api

# Node Environment
NODE_ENV=test
LOG_LEVEL=debug
```

### Database Setup

1. Create test database:
```sql
CREATE DATABASE oracle_ledger_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE oracle_ledger_test TO test_user;
```

2. Run migrations:
```bash
# Apply main schema
psql -U test_user -d oracle_ledger_test -f database-schema.sql

# Apply Stripe schema
psql -U test_user -d oracle_ledger_test -f database-schema-stripe.sql

# Apply fee tracking schema
psql -U test_user -d oracle_ledger_test -f database-schema-fee-tracking.sql
```

## Test Data Management

### Mock Data Generation

The test suite automatically generates:

- **Test Customers**: Business and consumer customers with various attributes
- **Test Bank Accounts**: Verified and unverified bank accounts
- **Test ACH Payments**: Various payment scenarios and statuses
- **Test Direct Deposit Recipients**: Employee/contractor profiles
- **Test Webhook Events**: Simulated Stripe webhook payloads
- **Test Compliance Records**: Audit logs and compliance check items

### Data Cleanup

All test data is automatically cleaned up after test execution:

```javascript
// Automatic cleanup in test-environment-setup.js cleanup() method
async function cleanup() {
  // Clean up test data from all tables
  // Delete test Stripe customers
  // Close database connections
}
```

## Performance Testing

### High-Volume Scenarios

Test suite includes performance testing for:

- **Database Queries**: Index usage and query optimization
- **API Endpoints**: Response times and rate limiting
- **Frontend Rendering**: Component loading and interaction times
- **Payment Processing**: ACH transaction throughput

### Performance Thresholds

- Database queries: < 1000ms
- API responses: < 5000ms
- Frontend interactions: < 2000ms
- Payment processing: < 30000ms

## Security Testing

### Payment Security

Test suite validates:

- **PCI Compliance**: Card data handling and storage
- **ACH Compliance**: NACHA rules and regulations
- **Data Encryption**: Sensitive data protection
- **Access Controls**: Authentication and authorization
- **Audit Trails**: Complete audit logging

### Security Test Examples

```javascript
// Test authentication
const authResult = await testSuite.testAuthentication();
assert.isTrue(authResult.success, 'Authentication should work');

// Test authorization
const authzResult = await testSuite.testAuthorization();
assert.isTrue(authzResult.details.viewerCannotWrite, 'Viewer should not write');

// Test audit logging
const auditResult = await testSuite.testAuditLogging();
assert.isTrue(auditResult.details.auditTrailComplete, 'Complete audit trail required');
```

## Error Handling and Edge Cases

### Common Error Scenarios Tested

- **Network Failures**: Connection timeouts and drops
- **Invalid Data**: Malformed requests and responses
- **Rate Limiting**: API throttling and retry logic
- **Authentication Failures**: Invalid tokens and permissions
- **Database Constraints**: Foreign key violations and data validation
- **Payment Failures**: Insufficient funds and account issues

### Error Injection

```javascript
// Example: Test payment failure handling
async function testPaymentFailure() {
  const customer = getTestCustomer('business');
  
  // Simulate network failure
  mockNetworkFailure(true);
  
  const result = await processAchPayment({
    customerId: customer.id,
    amount: 100.00
  });
  
  assert.isFalse(result.success, 'Payment should fail with network error');
  assert.isDefined(result.error, 'Error message should be provided');
  
  // Restore network
  mockNetworkFailure(false);
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-suite.yml
name: ACH Payment Test Suite

on: [push, pull_request]

jobs:
  test-suite:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: oracle_ledger_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run database migrations
      run: |
        psql -h localhost -U test_user -d oracle_ledger_test -f database-schema.sql
        psql -h localhost -U test_user -d oracle_ledger_test -f database-schema-stripe.sql
        
    - name: Run complete test suite
      env:
        TEST_DB_HOST: localhost
        TEST_DB_USER: test_user
        TEST_DB_PASSWORD: test_password
        TEST_DB_NAME: oracle_ledger_test
        STRIPE_TEST_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
      run: node run-all-tests.js
      
    - name: Upload test results
      uses: actions/upload-artifact@v2
      if: always()
      with:
        name: test-results
        path: test-results/
```

## Test Results and Reporting

### Test Report Structure

```json
{
  "summary": {
    "total": 65,
    "passed": 62,
    "failed": 3,
    "successRate": "95.38%",
    "executionTime": 125000
  },
  "tests": [
    {
      "name": "testAchPaymentProcessing",
      "status": "PASSED",
      "executionTime": 2500,
      "details": {
        "successfulPayment": "ach_123",
        "failedPaymentHandled": true,
        "feeCalculation": 455
      }
    }
  ],
  "performance": {
    "averageExecutionTime": 1923,
    "slowestTests": [
      { "name": "testFrontendIntegration", "executionTime": 15420 }
    ]
  },
  "coverage": {
    "codeCoverage": "94.2%",
    "testCoverage": "comprehensive"
  }
}
```

### HTML Test Reports

Generate HTML reports for better visualization:

```javascript
const fs = require('fs');
const path = require('path');

function generateHtmlReport(testResults) {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>ACH Payment Test Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .summary { background: #f0f8ff; padding: 20px; border-radius: 5px; }
      .passed { color: green; }
      .failed { color: red; }
      .test-details { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    </style>
  </head>
  <body>
    <h1>ACH Payment Test Report</h1>
    <div class="summary">
      <h2>Summary</h2>
      <p>Total Tests: ${testResults.summary.total}</p>
      <p class="passed">Passed: ${testResults.summary.passed}</p>
      <p class="failed">Failed: ${testResults.summary.failed}</p>
      <p>Success Rate: ${testResults.summary.successRate}</p>
      <p>Execution Time: ${testResults.summary.executionTime}ms</p>
    </div>
    
    <h2>Test Details</h2>
    ${testResults.tests.map(test => `
      <div class="test-details">
        <h3 class="${test.status.toLowerCase()}">${test.name}</h3>
        <p>Status: ${test.status}</p>
        <p>Execution Time: ${test.executionTime}ms</p>
        ${test.error ? `<p class="failed">Error: ${test.error}</p>` : ''}
      </div>
    `).join('')}
  </body>
  </html>
  `;
  
  fs.writeFileSync('test-results/report.html', html);
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify test database is running
   - Check connection credentials
   - Ensure database exists and is accessible

2. **Stripe API Errors**
   - Verify test API keys are valid
   - Check Stripe account has test mode enabled
   - Ensure webhook endpoints are configured

3. **Frontend Test Failures**
   - Check if application is running on test port
   - Verify build process completed successfully
   - Check browser console for JavaScript errors

4. **Timeout Issues**
   - Increase timeout values in test configuration
   - Check system resources and performance
   - Verify network connectivity

### Debug Mode

Enable detailed logging:

```javascript
// Enable debug mode
process.env.LOG_LEVEL = 'debug';
process.env.NODE_ENV = 'test';

// Run with verbose output
DEBUG=test-suite:* node run-all-tests.js
```

## Best Practices

### Test Data Management

- Always use unique identifiers for test records
- Clean up test data after each test run
- Use mock data that doesn't interfere with production
- Maintain data consistency across related tables

### Test Organization

- Group related tests in logical suites
- Use descriptive test names
- Include setup and teardown methods
- Document complex test scenarios

### Performance Optimization

- Run tests in parallel when possible
- Use database transactions for data setup
- Cache test data when appropriate
- Monitor test execution times

### Security Considerations

- Never use real payment data in tests
- Secure test environment credentials
- Validate all user inputs in tests
- Audit test data access

## Conclusion

This comprehensive test suite provides thorough coverage of the ORACLE-LEDGER ACH payment system. It ensures:

- **Reliability**: All payment flows work correctly
- **Performance**: System handles expected load
- **Security**: Payment data is properly protected
- **Compliance**: Regulatory requirements are met
- **Maintainability**: Code changes don't break existing functionality

The test suite can be integrated into CI/CD pipelines and run automatically on every code change, ensuring the payment system remains stable and secure.